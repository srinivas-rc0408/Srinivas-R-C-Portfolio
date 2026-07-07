"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { motion } from "framer-motion";
import {
  X,
  Loader2,
  RotateCcw,
  FileText,
  ScrollText,
  FolderKanban,
  Award,
  Briefcase,
  GraduationCap,
  Crown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SPIDEY DASH — Geometry-Dash-style one-touch runner.
   Fixed 1280×720 world (Scale.FIT). Tap / click / Space to jump.
   Every 100m unlocks a portfolio achievement (toasted in-game,
   revealed from a red Spidey box on the death screen). Floating
   motivation texts ride the background — hype pool past 500m.
   Best score + all-time achievements persist in localStorage.
   ═══════════════════════════════════════════════════════════════ */

const BASE_W = 1280;
const BASE_H = 720;
const GROUND_H = 110;
const CUBE = 44;
const SPEED = 460;
const GRAVITY = 3400;
const JUMP_V = -1150;
const BEST_KEY = "spidey-dash-best";
const ACH_KEY = "spidey-dash-achievements";

const ACHIEVEMENTS = [
  { m: 100, id: "resume", label: "Resume", icon: FileText },
  { m: 200, id: "cv", label: "CV", icon: ScrollText },
  { m: 300, id: "projects", label: "Projects", icon: FolderKanban },
  { m: 400, id: "certifications", label: "Certifications", icon: Award },
  { m: 500, id: "experience", label: "Experience", icon: Briefcase },
  { m: 600, id: "education", label: "Education", icon: GraduationCap },
  { m: 700, id: "legend", label: "Web-Head Legend", icon: Crown },
];

const MOTIVATION = [
  "YOU CAN DO IT",
  "FOCUS",
  "KEEP GOING",
  "SMOOTH, RIGHT?",
  "THE DEV BEHIND THIS IS AWESOME",
  "DON'T BLINK",
  "BUILT DIFFERENT",
];
const MOTIVATION_500 = [
  "500M+ — HIRE THIS HUMAN",
  "ABSOLUTE LEGEND",
  "SRINIVAS APPROVES",
  "UNSTOPPABLE",
  "MAIN CHARACTER ENERGY",
  "YOU'RE CRACKED",
];

interface DeathData {
  score: number;
  best: number;
}

interface GeometryDashProps {
  onExit: () => void;
}

function readStoredAchievements(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ACH_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function GeometryDash({ onExit }: GeometryDashProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [death, setDeath] = useState<DeathData | null>(null);
  /* Achievements unlocked before this run started (for the NEW badge) */
  const prevUnlockedRef = useRef<string[]>([]);

  useEffect(() => {
    if (!gameRef.current || gameInstance.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    class DashScene extends Phaser.Scene {
      player!: Phaser.Physics.Arcade.Sprite;
      obstacles!: Phaser.Physics.Arcade.Group;
      groundDashes: Phaser.GameObjects.Rectangle[] = [];
      stars: Phaser.GameObjects.Image[] = [];
      motivations: Phaser.GameObjects.Text[] = [];
      trail!: Phaser.GameObjects.Particles.ParticleEmitter;
      scoreText!: Phaser.GameObjects.Text;
      bestText!: Phaser.GameObjects.Text;
      toastText!: Phaser.GameObjects.Text;
      spinTween: Phaser.Tweens.Tween | null = null;
      score = 0;
      best = 0;
      dead = false;
      lastJumpPress = -1;
      nextMilestoneIdx = 0;
      pressHandler = () => {
        if (!this.dead) this.lastJumpPress = this.time.now;
      };

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
        this.nextMilestoneIdx = 0;
        this.groundDashes = [];
        this.stars = [];
        this.motivations = [];
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

        // Achievement toast (reused, tweened in on each unlock)
        this.toastText = this.add
          .text(BASE_W / 2, 128, "", { ...font, fontSize: "20px", color: "#f87171" })
          .setOrigin(0.5)
          .setAlpha(0);

        // Input: single DOM-level press channel (canvas + letterbox bars +
        // touch all land here) + keyboard.
        window.addEventListener("dash-press", this.pressHandler);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
          window.removeEventListener("dash-press", this.pressHandler);
        });
        this.input.keyboard?.on("keydown-SPACE", this.pressHandler);
        this.input.keyboard?.on("keydown-UP", this.pressHandler);

        this.spawnNext(900);
        this.spawnMotivation(2200);
        setIsLoading(false);
        setDeath(null);
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

      /* Faint motivation texts drifting through the sky */
      spawnMotivation(delayMs: number) {
        this.time.delayedCall(delayMs, () => {
          if (this.dead) return;
          const pool = this.score >= 500 ? MOTIVATION_500 : MOTIVATION;
          const msg = pool[Math.floor(Math.random() * pool.length)];
          const txt = this.add
            .text(BASE_W + 220, 80 + Math.random() * (BASE_H - GROUND_H - 260), msg, {
              fontFamily: "'Arial Black', Verdana, sans-serif",
              fontSize: `${26 + Math.floor(Math.random() * 14)}px`,
              color: this.score >= 500 ? "#f87171" : "#a1a1aa",
            })
            .setAlpha(this.score >= 500 ? 0.22 : 0.14);
          this.motivations.push(txt);
          this.spawnMotivation(2600 + Math.random() * 1800);
        });
      }

      toast(label: string) {
        this.toastText.setText(`★ ${label.toUpperCase()} UNLOCKED`);
        this.toastText.setAlpha(0);
        this.toastText.y = 112;
        this.tweens.add({
          targets: this.toastText,
          alpha: 1,
          y: 128,
          duration: 260,
          ease: "Back.Out",
          yoyo: true,
          hold: 1300,
        });
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

        const finalScore = Math.floor(this.score);
        if (finalScore > this.best) {
          this.best = finalScore;
          localStorage.setItem(BEST_KEY, String(finalScore));
        }
        // Persist all-time achievements
        const unlockedNow = ACHIEVEMENTS.filter((a) => a.m <= finalScore).map((a) => a.id);
        const allTime = Array.from(new Set([...readStoredAchievements(), ...unlockedNow]));
        localStorage.setItem(ACH_KEY, JSON.stringify(allTime));

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
        // Small beat so the explosion reads before the overlay slides in
        this.time.delayedCall(450, () => setDeath({ score: finalScore, best: this.best }));
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

        // Milestone achievements every 100m
        const next = ACHIEVEMENTS[this.nextMilestoneIdx];
        if (next && this.score >= next.m) {
          this.nextMilestoneIdx++;
          this.toast(next.label);
        }

        // Parallax stars + ground streaks + motivation drift
        for (const star of this.stars) {
          star.x -= SPEED * 0.18 * dt;
          if (star.x < -6) star.x = BASE_W + 6;
        }
        for (const dash of this.groundDashes) {
          dash.x -= SPEED * dt;
          if (dash.x < -30) dash.x = BASE_W + 30;
        }
        this.motivations = this.motivations.filter((t) => {
          t.x -= SPEED * 0.45 * dt;
          if (t.x < -t.width - 40) {
            t.destroy();
            return false;
          }
          return true;
        });

        // Cull passed obstacles
        for (const obj of this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (obj.x < -100) obj.destroy();
        }
      }
    }

    prevUnlockedRef.current = readStoredAchievements();

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

  const handleRetry = () => {
    prevUnlockedRef.current = readStoredAchievements();
    setDeath(null);
    gameInstance.current?.scene.getScene("DashScene")?.scene.restart();
  };

  const allTimeUnlocked = death ? readStoredAchievements() : [];

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black font-sans"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
      onPointerDown={() => {
        if (!death) window.dispatchEvent(new Event("dash-press"));
      }}
    >
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
        className="absolute right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors hover:bg-red-500"
      >
        <X size={24} strokeWidth={3} />
      </motion.button>

      {/* ── Death overlay: score + achievement box reveal ── */}
      {death && (
        <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex w-full max-w-md flex-col items-center gap-6 text-center"
          >
            <div className="flex flex-col items-center gap-1">
              <h2
                className="text-5xl font-black uppercase tracking-widest text-red-500"
                style={{ textShadow: "0 0 30px rgba(220,38,38,0.5)" }}
              >
                Crashed
              </h2>
              <p className="text-2xl font-black text-white">{death.score}m</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Best {death.best}m
              </p>
            </div>

            <AchievementReveal
              unlockedIds={allTimeUnlocked}
              newIds={ACHIEVEMENTS.filter(
                (a) => a.m <= death.score && !prevUnlockedRef.current.includes(a.id)
              ).map((a) => a.id)}
            />

            <div className="flex w-full max-w-xs flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_25px_rgba(220,38,38,0.35)] hover:bg-red-500"
              >
                <RotateCcw size={14} /> Try Again
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Exit
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ── Red Spidey reward box: lid springs open, achievement chips pop out ── */
function AchievementReveal({ unlockedIds, newIds }: { unlockedIds: string[]; newIds: string[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, []);

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Chips pop out above the box once it opens */}
      <div className="flex min-h-[76px] w-full flex-wrap items-end justify-center gap-2">
        {open && unlocked.length === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-zinc-500"
          >
            Reach 100m to unlock your first reward.
          </motion.p>
        )}
        {open &&
          unlocked.map(({ id, label, icon: Icon }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 56, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 + i * 0.09 }}
              className="relative flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2"
            >
              <Icon size={14} className="text-red-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">{label}</span>
              {newIds.includes(id) && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                  NEW
                </span>
              )}
            </motion.div>
          ))}
      </div>

      {/* The box itself — front face with logo, lid hinged at the back */}
      <div style={{ perspective: 700 }}>
        <div
          className="relative"
          style={{ width: 130, height: 74, transformStyle: "preserve-3d", transform: "rotateX(-14deg)" }}
        >
          {/* lid */}
          <motion.div
            className="absolute inset-x-0 top-0 flex h-6 items-center justify-center rounded-t-lg border border-red-500/30"
            style={{
              transformOrigin: "top center",
              background: "linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%)",
            }}
            animate={{ rotateX: open ? 130 : 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.1 }}
          />
          {/* body with the portfolio logo */}
          <div
            className="absolute inset-x-0 bottom-0 flex h-[52px] items-center justify-center rounded-b-lg border border-red-500/30"
            style={{ background: "linear-gradient(160deg, #7f1d1d 0%, #2b0709 100%)" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border"
              style={{ borderColor: "#DC2626", background: "#050508" }}
            >
              <span className="text-sm font-bold" style={{ color: "#DC2626" }}>
                S
              </span>
            </div>
          </div>
          {/* glow from inside when open */}
          <motion.div
            className="pointer-events-none absolute inset-x-2 top-0 h-10 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(248,113,113,0.5), transparent 70%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
}
