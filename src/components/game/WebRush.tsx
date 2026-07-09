"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { motion } from "framer-motion";
import { X, Loader2, RotateCcw } from "lucide-react";
import Leaderboard from "@/src/components/game/Leaderboard";

/* ═══════════════════════════════════════════════════════════════
   WEB RUSH — Subway-Surfers-style 3-lane runner.
   Portrait 720×1280 world (Scale.FIT). Swipe / arrow keys to change
   lanes, swipe up / Space / tap to jump. Low barriers are jumpable,
   full blockers must be dodged; web tokens add +5. Speed ramps.
   Best score persists; scores post to the global "rush" leaderboard.
   ═══════════════════════════════════════════════════════════════ */

const BASE_W = 720;
const BASE_H = 1280;
const LANES = [180, 360, 540];
const PLAYER_Y = 1040;
const START_SPEED = 380;
const MAX_SPEED = 900;
const RAMP_PER_S = 9;
const JUMP_MS = 520;
const BEST_KEY = "web-rush-best";

interface DeathData {
  score: number;
  best: number;
}

interface WebRushProps {
  onExit: () => void;
}

export default function WebRush({ onExit }: WebRushProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [death, setDeath] = useState<DeathData | null>(null);

  useEffect(() => {
    if (!gameRef.current || gameInstance.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    class RushScene extends Phaser.Scene {
      player!: Phaser.GameObjects.Image;
      playerShadow!: Phaser.GameObjects.Ellipse;
      obstacles: { obj: Phaser.GameObjects.Image; lane: number; kind: "barrier" | "train" }[] = [];
      tokens: { obj: Phaser.GameObjects.Image; lane: number }[] = [];
      laneDashes: Phaser.GameObjects.Rectangle[] = [];
      scoreText!: Phaser.GameObjects.Text;
      bestText!: Phaser.GameObjects.Text;
      lane = 1;
      speed = START_SPEED;
      distance = 0;
      webs = 0;
      best = 0;
      dead = false;
      airborne = false;
      swipeStart: { x: number; y: number } | null = null;

      constructor() {
        super({ key: "RushScene" });
      }

      preload() {
        const g = this.add.graphics();

        // Runner: Spidey-red rounded figure with white eye band
        g.fillStyle(0xdc2626, 1);
        g.fillRoundedRect(0, 0, 72, 88, 18);
        g.fillStyle(0x7f1d1d, 1);
        g.fillRoundedRect(8, 8, 56, 72, 14);
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(14, 22, 18, 12, 5);
        g.fillRoundedRect(40, 22, 18, 12, 5);
        g.generateTexture("runner", 72, 88);
        g.clear();

        // Low barrier — jumpable, hazard-striped
        g.fillStyle(0x27272a, 1);
        g.fillRoundedRect(0, 0, 150, 42, 8);
        g.fillStyle(0xf59e0b, 1);
        for (let i = 0; i < 4; i++) g.fillRect(10 + i * 36, 8, 18, 26);
        g.generateTexture("barrier", 150, 42);
        g.clear();

        // Train blocker — tall, must be dodged
        g.fillStyle(0x18181b, 1);
        g.fillRoundedRect(0, 0, 150, 220, 12);
        g.lineStyle(2, 0xdc2626, 0.9);
        g.strokeRoundedRect(1, 1, 148, 218, 12);
        g.fillStyle(0x3f3f46, 1);
        g.fillRoundedRect(14, 16, 122, 44, 8);
        g.fillStyle(0xdc2626, 1);
        g.fillRect(0, 200, 150, 8);
        g.generateTexture("train", 150, 220);
        g.clear();

        // Web token
        g.lineStyle(3, 0xffffff, 0.95);
        g.strokeCircle(18, 18, 15);
        g.lineBetween(18, 3, 18, 33);
        g.lineBetween(3, 18, 33, 18);
        g.lineBetween(8, 8, 28, 28);
        g.lineBetween(28, 8, 8, 28);
        g.generateTexture("web", 36, 36);
        g.clear();

        // dot for particles
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 5, 5);
        g.generateTexture("dot", 5, 5);
        g.destroy();
      }

      create() {
        this.lane = 1;
        this.speed = START_SPEED;
        this.distance = 0;
        this.webs = 0;
        this.dead = false;
        this.airborne = false;
        this.obstacles = [];
        this.tokens = [];
        this.laneDashes = [];
        this.best = Number(localStorage.getItem(BEST_KEY) ?? 0);

        // Track: side rails + lane divider dashes
        this.add.rectangle(90, BASE_H / 2, 6, BASE_H, 0x27272a);
        this.add.rectangle(BASE_W - 90, BASE_H / 2, 6, BASE_H, 0x27272a);
        for (const x of [270, 450]) {
          for (let i = 0; i < 12; i++) {
            const dash = this.add.rectangle(x, i * 120, 4, 56, 0x3f3f46, 0.7);
            this.laneDashes.push(dash);
          }
        }

        // Player + shadow
        this.playerShadow = this.add.ellipse(LANES[1], PLAYER_Y + 46, 66, 18, 0x000000, 0.45);
        this.player = this.add.image(LANES[1], PLAYER_Y, "runner");

        // HUD
        const font = { fontFamily: "'Arial Black', Verdana, sans-serif" };
        this.scoreText = this.add
          .text(BASE_W / 2, 64, "0", { ...font, fontSize: "44px", color: "#ffffff" })
          .setOrigin(0.5);
        this.bestText = this.add
          .text(BASE_W / 2, 112, this.best > 0 ? `BEST ${this.best}` : "", {
            ...font,
            fontSize: "17px",
            color: "#71717a",
          })
          .setOrigin(0.5);
        this.add
          .text(BASE_W / 2, BASE_H - 64, "SWIPE / ARROWS · JUMP: TAP / SPACE", {
            ...font,
            fontSize: "16px",
            color: "#52525b",
          })
          .setOrigin(0.5);

        // Input — keyboard
        this.input.keyboard?.on("keydown-LEFT", () => this.moveLane(-1));
        this.input.keyboard?.on("keydown-RIGHT", () => this.moveLane(1));
        this.input.keyboard?.on("keydown-A", () => this.moveLane(-1));
        this.input.keyboard?.on("keydown-D", () => this.moveLane(1));
        this.input.keyboard?.on("keydown-SPACE", () => this.jump());
        this.input.keyboard?.on("keydown-UP", () => this.jump());

        // Input — swipe (left/right = lane, up = jump, plain tap = jump)
        this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
          this.swipeStart = { x: p.x, y: p.y };
        });
        this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
          if (!this.swipeStart) return;
          const dx = p.x - this.swipeStart.x;
          const dy = p.y - this.swipeStart.y;
          this.swipeStart = null;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
          else this.jump(); // swipe up or tap
        });

        this.spawnRow(700);
        setIsLoading(false);
        setDeath(null);
        if (process.env.NODE_ENV === "development") {
          (window as unknown as Record<string, unknown>).__rushScene = this;
        }
      }

      moveLane(dir: number) {
        if (this.dead) return;
        const next = Phaser.Math.Clamp(this.lane + dir, 0, 2);
        if (next === this.lane) return;
        this.lane = next;
        this.tweens.add({
          targets: [this.player, this.playerShadow],
          x: LANES[next],
          duration: 130,
          ease: "Sine.Out",
        });
      }

      jump() {
        if (this.dead || this.airborne) return;
        this.airborne = true;
        // scale-up arc + shadow shrink sell the hop in the top-down view
        this.tweens.add({
          targets: this.player,
          scale: 1.32,
          y: PLAYER_Y - 46,
          duration: JUMP_MS / 2,
          yoyo: true,
          ease: "Quad.Out",
          onComplete: () => {
            this.airborne = false;
          },
        });
        this.tweens.add({
          targets: this.playerShadow,
          scaleX: 0.6,
          scaleY: 0.6,
          alpha: 0.25,
          duration: JUMP_MS / 2,
          yoyo: true,
          ease: "Quad.Out",
        });
      }

      /* Spawn a row of hazards ahead; always leaves at least one clear lane. */
      spawnRow(delayMs: number) {
        this.time.delayedCall(delayMs, () => {
          if (this.dead) return;
          const freeLane = Phaser.Math.Between(0, 2);
          const roll = Math.random();
          for (let lane = 0; lane < 3; lane++) {
            if (lane === freeLane) {
              // free lanes often carry a short web-token trail
              if (Math.random() < 0.55) {
                for (let i = 0; i < 3; i++) {
                  const t = this.add.image(LANES[lane], -80 - i * 90, "web");
                  this.tokens.push({ obj: t, lane });
                }
              }
              continue;
            }
            if (roll < 0.35 && Math.random() < 0.5) continue; // sparse early rows
            const kind: "barrier" | "train" = Math.random() < 0.45 ? "barrier" : "train";
            const obj = this.add.image(LANES[lane], kind === "train" ? -140 : -60, kind);
            this.obstacles.push({ obj, lane, kind });
          }
          // next row: gap shrinks as speed rises (constant reaction time)
          const gapPx = 520 + Math.random() * 300;
          this.spawnRow((gapPx / this.speed) * 1000);
        });
      }

      die() {
        if (this.dead) return;
        this.dead = true;
        const finalScore = Math.floor(this.distance / 40) + this.webs * 5;
        if (finalScore > this.best) {
          this.best = finalScore;
          localStorage.setItem(BEST_KEY, String(finalScore));
        }
        this.player.setVisible(false);
        this.playerShadow.setVisible(false);
        this.add
          .particles(this.player.x, this.player.y, "dot", {
            speed: { min: 140, max: 460 },
            scale: { start: 1.6, end: 0 },
            lifespan: 700,
            quantity: 30,
            tint: [0xdc2626, 0xffffff, 0x7f1d1d],
            emitting: false,
          })
          .explode(30);
        if (!reduceMotion) this.cameras.main.shake(240, 0.014);
        this.time.delayedCall(450, () => setDeath({ score: finalScore, best: this.best }));
      }

      update(_t: number, deltaMs: number) {
        if (this.dead) return;
        const dt = deltaMs / 1000;
        this.speed = Math.min(MAX_SPEED, this.speed + RAMP_PER_S * dt);
        this.distance += this.speed * dt;

        const score = Math.floor(this.distance / 40) + this.webs * 5;
        this.scoreText.setText(String(score));

        // scroll lane dashes
        for (const d of this.laneDashes) {
          d.y += this.speed * dt;
          if (d.y > BASE_H + 60) d.y -= BASE_H + 120;
        }

        // obstacles march down
        this.obstacles = this.obstacles.filter(({ obj, lane, kind }) => {
          obj.y += this.speed * dt;
          if (obj.y > BASE_H + 160) {
            obj.destroy();
            return false;
          }
          if (lane === this.lane && Math.abs(obj.y - PLAYER_Y) < (kind === "train" ? 110 : 40)) {
            if (kind === "train" || !this.airborne) this.die();
          }
          return true;
        });

        // web tokens
        this.tokens = this.tokens.filter(({ obj, lane }) => {
          obj.y += this.speed * dt;
          if (obj.y > BASE_H + 60) {
            obj.destroy();
            return false;
          }
          if (lane === this.lane && Math.abs(obj.y - PLAYER_Y) < 44 && !this.airborne) {
            this.webs += 1;
            obj.destroy();
            return false;
          }
          return true;
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: BASE_W,
      height: BASE_H,
      scene: [RushScene],
      backgroundColor: "#0a0a0e",
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
    setDeath(null);
    gameInstance.current?.scene.getScene("RushScene")?.scene.restart();
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black font-sans"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
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

      {/* ── Death overlay ── */}
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
                Wiped Out
              </h2>
              <p className="text-2xl font-black text-white">{death.score}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Best {death.best}
              </p>
            </div>

            <Leaderboard game="rush" score={death.score} unit="" />

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
