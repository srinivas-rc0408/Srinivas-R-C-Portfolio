"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO GAME (PHASER 3 + REACT BRIDGE)
   A smooth 2D side-scrolling experience running on Canvas,
   overlaid with DOM-based glassmorphic UI modals.
   ═══════════════════════════════════════════════════════════════ */

export default function PortfolioGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedItem, setUnlockedItem] = useState<{ id: string; name: string } | null>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const router = useRouter();

  // ── INIT PHASER ──
  useEffect(() => {
    if (typeof window === "undefined" || !gameRef.current) return;

    // Define the Main Scene
    class MainScene extends Phaser.Scene {
      player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      busStops!: Phaser.Physics.Arcade.StaticGroup;

      constructor() {
        super({ key: "MainScene" });
      }

      preload() {
        // Generate placeholder textures to avoid external asset loading delays
        const graphics = this.add.graphics();
        
        // Player texture (Red Cube)
        graphics.fillStyle(0xdc2626, 1);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture("player", 40, 40);
        graphics.clear();

        // Floor texture (Dark Zinc)
        graphics.fillStyle(0x18181b, 1);
        graphics.fillRect(0, 0, 800, 100);
        graphics.generateTexture("floor", 800, 100);
        graphics.clear();

        // Bus Stop/Milestone texture (Glowing Red/White)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 60, 120);
        graphics.generateTexture("bus_stop", 60, 120);
        graphics.clear();
      }

      create() {
        // Notify React that the engine has initialized
        setIsLoading(false);

        // Environment Background
        this.cameras.main.setBackgroundColor("#050508");

        // --- PLATFORMS ---
        const platforms = this.physics.add.staticGroup();
        // Create a long floor
        for (let i = 0; i < 10; i++) {
          platforms.create(400 + i * 800, this.scale.height - 50, "floor").refreshBody();
        }

        // --- PLAYER ---
        this.player = this.physics.add.sprite(100, this.scale.height - 200, "player");
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false); // Let them run forever

        // --- CAMERA FOLLOW ---
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setFollowOffset(-200, 0); // Keep player slightly left of center

        // --- BUS STOPS (MILESTONES) ---
        this.busStops = this.physics.add.staticGroup();
        
        const milestones = [
          { x: 1200, id: "experience", name: "Experience Record" },
          { x: 2400, id: "education", name: "Education History" },
          { x: 3600, id: "neuroforge", name: "NeuroForge Engine Project" },
        ];

        milestones.forEach((m) => {
          const stop = this.busStops.create(m.x, this.scale.height - 160, "bus_stop") as Phaser.Physics.Arcade.Sprite;
          // Store data in the sprite
          stop.setData("id", m.id);
          stop.setData("name", m.name);
          stop.setData("hit", false);
          
          // Add a glowing text label above it
          this.add.text(m.x, this.scale.height - 250, m.name, {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#dc2626",
            fontStyle: "bold"
          }).setOrigin(0.5);
        });

        // --- COLLISIONS ---
        this.physics.add.collider(this.player, platforms);
        
        this.physics.add.overlap(this.player, this.busStops, (player, stopObj) => {
          const stop = stopObj as Phaser.Physics.Arcade.Sprite;
          if (stop.getData("hit")) return; // Already triggered

          // Mark as hit
          stop.setData("hit", true);
          // Tint it to show it's deactivated
          stop.setTint(0x3f3f46);

          // Pause Physics
          this.physics.pause();
          
          // Dispatch DOM Event to React
          window.dispatchEvent(new CustomEvent("GAME_UNLOCK", {
            detail: {
              id: stop.getData("id"),
              name: stop.getData("name")
            }
          }));
        });

        // --- INPUTS ---
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
        }

        // Tap to jump (mobile support)
        this.input.on('pointerdown', () => {
          if (this.player.body?.touching.down && this.physics.world.isPaused === false) {
            this.player.setVelocityY(-400);
          }
        });
      }

      update() {
        if (!this.player || !this.cursors) return;

        // Player Movement Logic
        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(300);
        } else {
          this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
          this.player.setVelocityY(-400);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 800 },
          debug: false,
        },
      },
      scene: [MainScene],
      backgroundColor: "#050508",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Initialize Game
    gameInstance.current = new Phaser.Game(config);

    // --- EVENT LISTENER FOR REACT BRIDGE ---
    const handleUnlock = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUnlockedItem(customEvent.detail);
    };
    window.addEventListener("GAME_UNLOCK", handleUnlock);

    // --- CLEANUP (Memory Management) ---
    return () => {
      window.removeEventListener("GAME_UNLOCK", handleUnlock);
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  const handleContinue = () => {
    setUnlockedItem(null);
    if (gameInstance.current) {
      // Resume the active scene's physics
      const scene = gameInstance.current.scene.getScene("MainScene");
      if (scene) {
        scene.physics.resume();
      }
    }
  };

  const handleViewDetails = () => {
    if (unlockedItem) {
      router.push(`/details#${unlockedItem.id}`);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      
      {/* ── SKELETON LOADER ── */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]">
          <Loader2 className="animate-spin text-red-500 mb-4" size={48} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading Engine...</h2>
        </div>
      )}

      {/* ── PHASER CANVAS MOUNT ── */}
      <div ref={gameRef} className="absolute inset-0 z-0" />

      {/* ── ON-SCREEN INSTRUCTIONS (Disappears on interaction) ── */}
      {!isLoading && !unlockedItem && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1 }}
          className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            Use Arrow Keys or Tap to Move & Jump
          </p>
        </motion.div>
      )}

      {/* ── THE REACT MODAL OVERLAY (Glassmorphic) ── */}
      <AnimatePresence>
        {unlockedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-red-500/50 bg-zinc-900/80 p-8 shadow-[0_0_50px_-10px_rgba(220,38,38,0.3)] backdrop-blur-xl text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <span className="text-2xl">🎉</span>
              </div>
              
              <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">
                Checkpoint Reached
              </h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                You just unlocked the <br/>
                <strong className="text-red-400">{unlockedItem.name}</strong>!
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleViewDetails}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
                >
                  <Eye size={16} /> Click to View
                </button>
                <button
                  onClick={handleContinue}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Keep Exploring <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
