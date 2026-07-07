"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SPIDEY DASH — Geometry-Dash-style one-touch runner.
   Fixed 1280×720 world (Scale.FIT) so physics and difficulty are
   identical on every screen. Tap / click / Space to jump, cube
   rotates 180° per jump, spikes kill, pillars are landable.
   Best score persists in localStorage. No server logging.
   ═══════════════════════════════════════════════════════════════ */

const BASE_W = 1280;
const BASE_H = 720;
const GROUND_H = 110;
const CUBE = 44;
const SPEED = 460;
const GRAVITY = 3400;
const JUMP_V = -1150;
const BEST_KEY = "spidey-dash-best";

interface GeometryDashProps {
  onExit: () => void;
}

export default function GeometryDash({ onExit }: GeometryDashProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameRef.current || gameInstance.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    class DashScene extends Phaser.Scene {
      player!: Phaser.Physics.Arcade.Sprite;
      obstacles!: Phaser.Physics.Arcade.Group;
      groundDashes: Phaser.GameObjects.Rectangle[] = [];
      stars: Phaser.GameObjects.Image[] = [];
      trail!: Phaser.GameObjects.Particles.ParticleEmitter;
      scoreText!: Phaser.GameObjects.Text;
      bestText!: Phaser.GameObjects.Text;
      crashGroup!: Phaser.GameObjects.Container;
      spinTween: Phaser.Tweens.Tween | null = null;
      score = 0;
      best = 0;
      dead = false;
      deathAt = 0;
      lastJumpPress = -1;

      constructor() {
        super({ key: "DashScene" });
      }

      preload() {
        const g = this.add.graphics();

        // Cube: red body, darker inset, white eye band (Spidey mask vibe)
        g.fillStyle(0xdc2626, 1);
        g.fillRoundedRect(0, 0, CUBE, CUBE, 8);
        g.fillStyle(0x7f1d1d, 1);
        g.fillRoundedRect(5, 5, CUBE - 10, CUBE - 10, 6);
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(9, 14, 11, 8, 3);
        g.fillRoundedRect(CUBE - 20, 14, 11, 8, 3);
        g.generateTexture("cube", CUBE, CUBE);
        g.clear();

        // Spike: dark triangle with red edge
        g.fillStyle(0x18181b, 1);
        g.fillTriangle(0, CUBE, CUBE / 2, 0, CUBE, CUBE);
        g.lineStyle(2, 0xdc2626, 0.9);
        g.strokeTriangle(1, CUBE - 1, CUBE / 2, 1, CUBE - 1, CUBE - 1);
        g.generateTexture("spike", CUBE, CUBE);
        g.clear();

        // Pillar: landable block with red top edge
        g.fillStyle(0x131318, 1);
        g.fillRect(0, 0, CUBE, 66);
        g.lineStyle(1, 0x3f3f46, 1);
        g.strokeRect(0, 0, CUBE, 66);
        g.fillStyle(0xdc2626, 1);
        g.fillRect(0, 0, CUBE, 3);
        g.generateTexture("pillar", CUBE, 66);
        g.clear();

        // 4px dot for stars / particles
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture("dot", 4, 4);
        g.destroy();
      }

      create() {
        this.score = 0;
        this.dead = false;
        this.spinTween = null;
        this.lastJumpPress = -1;
        this.groundDashes = [];
        this.stars = [];
        this.best = Number(localStorage.getItem(BEST_KEY) ?? 0);

        // Starfield backdrop
        for (let i = 0; i < 34; i++) {
          const star = this.add
            .image(Math.random() * BASE_W, Math.random() * (BASE_H - GROUND_H - 40), "dot")
            .setAlpha(0.12 + Math.random() * 0.25)
            .setScale(0.5 + Math.random() * 0.8);
          this.stars.push(star);
        }

        // Ground
        const groundTop = BASE_H - GROUND_H;
        this.add.rectangle(BASE_W / 2, BASE_H - GROUND_H / 2, BASE_W, GROUND_H, 0x0a0a0e);
        this.add.rectangle(BASE_W / 2, groundTop, BASE_W, 2, 0xdc2626, 0.85);
        const ground = this.add.rectangle(BASE_W / 2, BASE_H - GROUND_H / 2, BASE_W, GROUND_H);
        this.physics.add.existing(ground, true);

        // Speed streaks on the ground
        for (let i = 0; i < 14; i++) {
          const dash = this.add.rectangle(
            (BASE_W / 14) * i,
            groundTop + 26 + Math.random() * 60,
            26,
            2,
            0x3f3f46,
            0.5
          );
          this.groundDashes.push(dash);
        }

        // Player
        this.player = this.physics.add.sprite(320, groundTop - CUBE / 2, "cube");
        this.player.setGravityY(GRAVITY);
        this.player.body!.setSize(CUBE - 8, CUBE - 4);
        this.physics.add.collider(this.player, ground, () => this.snapSpin());

        // Trail sparks while grounded
        this.trail = this.add.particles(0, 0, "dot", {
          speedX: { min: -160, max: -60 },
          speedY: { min: -40, max: 10 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 0.5, end: 0 },
          lifespan: 320,
          frequency: 28,
          tint: 0xdc2626,
          follow: this.player,
          followOffset: { x: -CUBE / 2, y: CUBE / 2 - 4 },
        });

        // Obstacles
        this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.physics.add.overlap(this.player, this.obstacles, (_p, obj) => {
          const sprite = obj as Phaser.Physics.Arcade.Sprite;
          if (sprite.texture.key === "spike") this.die();
        });
        this.physics.add.collider(
          this.player,
          this.obstacles,
          (_p, obj) => {
            const sprite = obj as Phaser.Physics.Arcade.Sprite;
            if (sprite.texture.key !== "pillar") return;
            // Landing on top is safe; smacking the side is not.
            if (this.player.body!.touching.right || !this.player.body!.touching.down) this.die();
            else this.snapSpin();
          },
          (_p, obj) => (obj as Phaser.Physics.Arcade.Sprite).texture.key === "pillar"
        );

        // HUD
        const font = { fontFamily: "'Arial Black', Verdana, sans-serif" };
        this.scoreText = this.add
          .text(BASE_W / 2, 44, "0m", { ...font, fontSize: "34px", color: "#ffffff" })
          .setOrigin(0.5);
        this.bestText = this.add
          .text(BASE_W / 2, 82, this.best > 0 ? `BEST ${this.best}m` : "", {
            ...font,
            fontSize: "14px",
            color: "#71717a",
          })
          .setOrigin(0.5);
        this.add
          .text(BASE_W / 2, groundTop + 62, "TAP · CLICK · SPACE TO JUMP", {
            ...font,
            fontSize: "13px",
            color: "#52525b",
          })
          .setOrigin(0.5);

        // Crash overlay (hidden until death)
        const crashTitle = this.add
          .text(0, -30, "CRASHED", { ...font, fontSize: "52px", color: "#dc2626" })
          .setOrigin(0.5);
        const crashHint = this.add
          .text(0, 34, "TAP TO RETRY", { ...font, fontSize: "16px", color: "#a1a1aa" })
          .setOrigin(0.5);
        this.crashGroup = this.add
          .container(BASE_W / 2, BASE_H / 2 - 60, [crashTitle, crashHint])
          .setVisible(false);

        // Input: jump, buffered 120ms so taps just before landing still fire
        const press = () => {
          if (this.dead) {
            if (this.time.now - this.deathAt > 350) this.scene.restart();
            return;
          }
          this.lastJumpPress = this.time.now;
        };
        this.input.on("pointerdown", press);
        this.input.keyboard?.on("keydown-SPACE", press);
        this.input.keyboard?.on("keydown-UP", press);

        this.spawnNext(900);
        setIsLoading(false);
      }

      /* Recursive spawner — gap tightens as the run gets longer */
      spawnNext(delayMs: number) {
        this.time.delayedCall(delayMs, () => {
          if (this.dead) return;
          this.spawnPattern();
          const minGap = Math.max(300, 430 - this.score / 6);
          const gapPx = minGap + Math.random() * 260;
          this.spawnNext((gapPx / SPEED) * 1000);
        });
      }

      spawnPattern() {
        const groundTop = BASE_H - GROUND_H;
        const x = BASE_W + 80;
        const roll = Math.random();
        const spikeAt = (sx: number) => {
          const s = this.obstacles.create(sx, groundTop - CUBE / 2, "spike") as Phaser.Physics.Arcade.Sprite;
          // generous hitbox — deaths should feel fair
          s.body!.setSize(18, 26);
          s.body!.setOffset((CUBE - 18) / 2, CUBE - 26);
          s.setVelocityX(-SPEED);
        };
        const pillarAt = (px: number) => {
          const p = this.obstacles.create(px, groundTop - 33, "pillar") as Phaser.Physics.Arcade.Sprite;
          p.setVelocityX(-SPEED);
        };

        if (roll < 0.4) spikeAt(x);
        else if (roll < 0.65) [0, CUBE].forEach((dx) => spikeAt(x + dx));
        else if (roll < 0.8) [0, CUBE, CUBE * 2].forEach((dx) => spikeAt(x + dx));
        else if (roll < 0.92) pillarAt(x);
        else {
          pillarAt(x);
          spikeAt(x + CUBE * 4);
        }
      }

      /* Stop the air-spin and settle flat on the nearest 90° */
      snapSpin() {
        if (!this.spinTween) return;
        this.spinTween.stop();
        this.spinTween = null;
        this.player.setAngle(Math.round(this.player.angle / 90) * 90);
      }

      die() {
        if (this.dead) return;
        this.dead = true;
        this.deathAt = this.time.now;

        const finalScore = Math.floor(this.score);
        if (finalScore > this.best) {
          this.best = finalScore;
          localStorage.setItem(BEST_KEY, String(finalScore));
        }

        // Freeze the world, blow up the cube
        this.obstacles.setVelocityX(0);
        this.trail.stop();
        this.player.setVisible(false);
        this.player.body!.enable = false;
        this.add.particles(this.player.x, this.player.y, "dot", {
          speed: { min: 120, max: 420 },
          scale: { start: 1.4, end: 0 },
          lifespan: 650,
          quantity: 26,
          tint: [0xdc2626, 0xffffff, 0x7f1d1d],
          emitting: false,
        }).explode(26);
        if (!reduceMotion) this.cameras.main.shake(220, 0.012);

        this.bestText.setText(`BEST ${this.best}m`);
        this.crashGroup.setVisible(true);
      }

      update(_time: number, deltaMs: number) {
        if (this.dead) return;
        const dt = deltaMs / 1000;

        // Buffered jump
        const grounded = this.player.body!.blocked.down || this.player.body!.touching.down;
        if (grounded && this.time.now - this.lastJumpPress < 120) {
          this.lastJumpPress = -1;
          this.player.setVelocityY(JUMP_V);
          this.snapSpin();
          this.spinTween = this.tweens.add({
            targets: this.player,
            angle: this.player.angle + 180,
            duration: 620,
            ease: "Linear",
          });
        }
        this.trail.emitting = grounded;

        // Score = meters survived
        this.score += (SPEED * dt) / 40;
        this.scoreText.setText(`${Math.floor(this.score)}m`);

        // Parallax stars + ground streaks
        for (const star of this.stars) {
          star.x -= SPEED * 0.18 * dt;
          if (star.x < -6) star.x = BASE_W + 6;
        }
        for (const dash of this.groundDashes) {
          dash.x -= SPEED * dt;
          if (dash.x < -30) dash.x = BASE_W + 30;
        }

        // Cull passed obstacles
        for (const obj of this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (obj.x < -100) obj.destroy();
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: BASE_W,
      height: BASE_H,
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [DashScene],
      backgroundColor: "#050508",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]">
          <Loader2 className="mb-4 animate-spin text-red-500" size={48} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading Engine...</h2>
        </div>
      )}

      <div ref={gameRef} className="absolute inset-0 z-0" />

      {/* ── Exit ── */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExit}
        aria-label="Exit game"
        className="absolute right-8 top-8 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors hover:bg-red-500"
      >
        <X size={24} strokeWidth={3} />
      </motion.button>
    </div>
  );
}
