"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Eye, X, Bike, Car, Bus, Gauge, Flag, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";
import nipplejs from "nipplejs";
import Leaderboard from "@/src/components/game/Leaderboard";

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO GAME (PHASER 4 + REACT BRIDGE)
   Full-screen top-down driving game. Nine bus stops map to the nine
   portfolio sections; reaching one pauses physics and dispatches a
   DOM CustomEvent that React turns into a glass popup.
   ═══════════════════════════════════════════════════════════════ */

type VehicleType = "motorcycle" | "car" | "bus";

interface VehicleStats {
  accel: number;
  maxSpeed: number;
  turnRate: number; // degrees/sec
  friction: number;
  size: [number, number];
  color: number;
  label: string;
  turningLabel: string;
}

const VEHICLE_STATS: Record<VehicleType, VehicleStats> = {
  motorcycle: { accel: 900, maxSpeed: 520, turnRate: 220, friction: 0.94, size: [26, 14], color: 0xf59e0b, label: "Motorcycle", turningLabel: "Very Tight" },
  car: { accel: 650, maxSpeed: 420, turnRate: 160, friction: 0.92, size: [36, 20], color: 0xdc2626, label: "Car", turningLabel: "Balanced" },
  bus: { accel: 400, maxSpeed: 300, turnRate: 90, friction: 0.9, size: [54, 28], color: 0x3b82f6, label: "Bus", turningLabel: "Wide" },
};

interface BusStopDef {
  id: string;
  name: string;
  shortInfo: string;
  route: string;
  x: number;
  y: number;
}

/* City block pitch 400px, buildings 260px centered in each block, leaving
   ~140px road corridors. Stops sit on block-line intersections (always road). */
const CELL = 400;
const WORLD_SIZE = CELL * 8; // 3200
const BUS_STOPS: BusStopDef[] = [
  { id: "portfolio-details", name: "Portfolio Details", shortInfo: "The full story, one scroll.", route: "/details", x: 400, y: 400 },
  { id: "projects", name: "Projects", shortInfo: "The project catalog.", route: "/projects", x: 1600, y: 400 },
  { id: "resume", name: "Resume", shortInfo: "The one-page resume.", route: "/", x: 2800, y: 400 },
  { id: "cv", name: "Curriculum Vitae", shortInfo: "The full CV.", route: "/", x: 400, y: 1600 },
  { id: "education", name: "Education", shortInfo: "Degrees and coursework.", route: "/details#education", x: 1600, y: 1600 },
  { id: "experience", name: "Experience", shortInfo: "Roles and responsibilities.", route: "/details#experience", x: 2800, y: 1600 },
  { id: "achievements", name: "Achievements", shortInfo: "Wins worth mentioning.", route: "/details#achievements", x: 400, y: 2800 },
  { id: "certifications", name: "Certifications", shortInfo: "Certs, chronologically.", route: "/details#certifications", x: 1600, y: 2800 },
  { id: "connect", name: "Connect", shortInfo: "Ways to reach Srinivas.", route: "/", x: 2800, y: 2800 },
];

const MINIMAP_SIZE = 150;

const TOUCH_QUERY = "(pointer: coarse)";
function subscribeTouch(callback: () => void) {
  const mq = window.matchMedia(TOUCH_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getTouchSnapshot() {
  return window.matchMedia(TOUCH_QUERY).matches;
}
function getTouchServerSnapshot() {
  return false;
}

interface UnlockDetail {
  id: string;
  name: string;
  shortInfo: string;
  route: string;
}

interface TripSummary {
  distance: number;
  stops: number;
  duration: number;
}

export default function PortfolioGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const joystickZoneRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const joystickManagerRef = useRef<ReturnType<typeof nipplejs.create> | null>(null);
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const tripStatsRef = useRef({ distance: 0, visited: new Set<string>(), startTime: 0 });

  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlocked, setUnlocked] = useState<UnlockDetail | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const isTouch = useSyncExternalStore(subscribeTouch, getTouchSnapshot, getTouchServerSnapshot);

  /* ── Nipplejs joystick (touch only) ── */
  useEffect(() => {
    const zone = joystickZoneRef.current;
    if (!isTouch || !vehicleType || !zone) return;

    const manager = nipplejs.create({
      zone,
      mode: "static",
      position: { left: "80px", bottom: "80px" },
      color: "#dc2626",
      size: 100,
    });
    joystickManagerRef.current = manager;

    manager.on("move", (evt) => {
      const vector = evt.data.vector;
      if (!vector) return;
      joystickVectorRef.current = { x: vector.x, y: vector.y };
    });
    manager.on("end", () => {
      joystickVectorRef.current = { x: 0, y: 0 };
    });

    return () => {
      manager.destroy();
      joystickManagerRef.current = null;
    };
  }, [isTouch, vehicleType]);

  /* ── Phaser lifecycle ── */
  useEffect(() => {
    if (!vehicleType || typeof window === "undefined" || !gameRef.current) return;

    const stats = VEHICLE_STATS[vehicleType];
    tripStatsRef.current = { distance: 0, visited: new Set(), startTime: Date.now() };
    const joystickVector = joystickVectorRef.current;

    class MainScene extends Phaser.Scene {
      player!: Phaser.Physics.Arcade.Sprite;
      buildings!: Phaser.Physics.Arcade.StaticGroup;
      stopSprites = new Map<string, Phaser.Physics.Arcade.Sprite>();
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
      lastX = 60;
      lastY = 60;
      minimapCamera!: Phaser.Cameras.Scene2D.Camera;
      skid!: Phaser.GameObjects.Particles.ParticleEmitter;

      constructor() {
        super({ key: "MainScene" });
      }

      preload() {
        const g = this.add.graphics();

        // Vehicle texture: colored body + white "nose" triangle marking front (rotation 0 = facing +x)
        const [w, h] = stats.size;
        g.fillStyle(stats.color, 1);
        g.fillRoundedRect(0, 0, w, h, 4);
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(w, h / 2, w - 8, 2, w - 8, h - 2);
        g.generateTexture("vehicle", w, h);
        g.clear();

        // Building texture — 200px in a 400px cell leaves 200px-wide roads,
        // enough room to line up drifts between blocks
        g.fillStyle(0x18181b, 1);
        g.fillRoundedRect(0, 0, 200, 200, 8);
        g.lineStyle(2, 0x3f3f46, 1);
        g.strokeRoundedRect(1, 1, 198, 198, 8);
        g.generateTexture("building", 200, 200);
        g.clear();

        // Bus stop pad — unvisited (glowing red/white) and visited (dim emerald)
        g.fillStyle(0xffffff, 1);
        g.fillCircle(20, 20, 20);
        g.fillStyle(0xdc2626, 1);
        g.fillCircle(20, 20, 13);
        g.generateTexture("stop_unvisited", 40, 40);
        g.clear();

        g.fillStyle(0x1f2937, 1);
        g.fillCircle(20, 20, 20);
        g.fillStyle(0x10b981, 1);
        g.fillCircle(20, 20, 13);
        g.generateTexture("stop_visited", 40, 40);
        g.clear();

        // Tire smoke puff for drifting — white, reads clearly on dark asphalt
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture("smoke", 8, 8);
        g.clear();

        g.destroy();
      }

      create() {
        setIsLoading(false);

        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.setBackgroundColor("#111114");
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Road base
        const roadGraphics = this.add.graphics();
        roadGraphics.fillStyle(0x1a1a1e, 1);
        roadGraphics.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Buildings — one per city block, collidable
        this.buildings = this.physics.add.staticGroup();
        for (let row = 0; row < WORLD_SIZE / CELL; row++) {
          for (let col = 0; col < WORLD_SIZE / CELL; col++) {
            const cx = CELL / 2 + col * CELL;
            const cy = CELL / 2 + row * CELL;
            this.buildings.create(cx, cy, "building");
          }
        }

        // Bus stops — overlap only, never block movement
        const stopsGroup = this.physics.add.staticGroup();
        BUS_STOPS.forEach((stop) => {
          const sprite = stopsGroup.create(stop.x, stop.y, "stop_unvisited") as Phaser.Physics.Arcade.Sprite;
          sprite.setData("id", stop.id);
          this.stopSprites.set(stop.id, sprite);
          this.add
            .text(stop.x, stop.y - 34, stop.name, { fontFamily: "monospace", fontSize: "13px", color: "#f4f4f5", fontStyle: "bold" })
            .setOrigin(0.5);
        });

        // Player
        this.player = this.physics.add.sprite(60, 60, "vehicle");
        this.player.setDamping(false);
        this.player.setDrag(0);
        // no setMaxVelocity: Arcade clamps per-axis (distorts diagonals);
        // the grip model clamps true forward speed instead
        this.player.setCollideWorldBounds(true);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // White tire smoke while drifting — dense enough to read as a trail
        this.skid = this.add.particles(0, 0, "smoke", {
          frequency: 14,
          lifespan: 620,
          alpha: { start: 0.55, end: 0 },
          scale: { start: 1.4, end: 3.4 },
          speed: { min: 4, max: 22 },
          follow: this.player,
          emitting: false,
        });

        this.physics.add.collider(this.player, this.buildings);
        this.physics.add.overlap(this.player, stopsGroup, (_playerObj, stopObj) => {
          const sprite = stopObj as Phaser.Physics.Arcade.Sprite;
          const id = sprite.getData("id") as string;
          if (tripStatsRef.current.visited.has(id)) return;

          tripStatsRef.current.visited.add(id);
          sprite.setTexture("stop_visited");

          const def = BUS_STOPS.find((s) => s.id === id)!;
          this.physics.pause();
          window.dispatchEvent(
            new CustomEvent("GAME_UNLOCK", { detail: { id: def.id, name: def.name, shortInfo: def.shortInfo, route: def.route } })
          );
        });

        // Minimap — player + stops only, no roads/buildings clutter
        const minimapZoom = MINIMAP_SIZE / WORLD_SIZE;
        this.minimapCamera = this.cameras.add(
          this.scale.width - MINIMAP_SIZE - 16,
          this.scale.height - MINIMAP_SIZE - 16,
          MINIMAP_SIZE,
          MINIMAP_SIZE
        );
        this.minimapCamera.setZoom(minimapZoom);
        this.minimapCamera.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.minimapCamera.centerOn(WORLD_SIZE / 2, WORLD_SIZE / 2);
        this.minimapCamera.setBackgroundColor(0x000000);
        this.minimapCamera.ignore(roadGraphics);
        this.minimapCamera.ignore(this.buildings);
        this.minimapCamera.ignore(this.skid);

        // Inputs
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasd = {
            up: this.input.keyboard.addKey("W"),
            down: this.input.keyboard.addKey("S"),
            left: this.input.keyboard.addKey("A"),
            right: this.input.keyboard.addKey("D"),
          };
        }
      }

      update(_time: number, delta: number) {
        if (!this.player || this.physics.world.isPaused) return;
        const dt = delta / 1000;
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        let throttle = 0;
        let steer = 0;

        if (this.cursors?.up.isDown || this.wasd?.up.isDown) throttle = 1;
        else if (this.cursors?.down.isDown || this.wasd?.down.isDown) throttle = -1;

        if (this.cursors?.left.isDown || this.wasd?.left.isDown) steer = -1;
        else if (this.cursors?.right.isDown || this.wasd?.right.isDown) steer = 1;

        // Touch joystick overrides keyboard when active
        const jv = joystickVector;
        if (jv.x !== 0 || jv.y !== 0) {
          throttle = jv.y;
          steer = jv.x;
        }

        /* ── Grip model: velocity split into forward/lateral components.
           Lateral velocity dies fast normally (the car tracks its nose);
           braking while steering at speed keeps it alive → controlled drift. ── */
        const forward = new Phaser.Math.Vector2(Math.cos(this.player.rotation), Math.sin(this.player.rotation));
        const right = new Phaser.Math.Vector2(-forward.y, forward.x);
        let vF = body.velocity.dot(forward);

        const drifting = throttle < 0 && vF > stats.maxSpeed * 0.3 && steer !== 0;

        if (steer !== 0) {
          // Steering scales with speed (no spinning in place), flips in reverse,
          // and bites harder mid-drift for the slide feel.
          const steerScale = Phaser.Math.Clamp(Math.abs(vF) / (stats.maxSpeed * 0.25), 0, 1);
          const reverse = vF < -20 ? -1 : 1;
          const driftBoost = drifting ? 1.45 : 1;
          this.player.rotation +=
            Phaser.Math.DegToRad(stats.turnRate) * steer * steerScale * reverse * driftBoost * dt;
          forward.set(Math.cos(this.player.rotation), Math.sin(this.player.rotation));
          right.set(-forward.y, forward.x);
          vF = body.velocity.dot(forward);
        }
        let vL = body.velocity.dot(right);

        if (throttle !== 0) {
          vF += stats.accel * throttle * dt;
        } else {
          vF *= Math.pow(stats.friction, dt * 60); // frame-rate independent coast
        }

        const grip = drifting ? 1.6 : 9;
        vL *= Math.exp(-grip * dt);

        vF = Phaser.Math.Clamp(vF, -stats.maxSpeed * 0.4, stats.maxSpeed);
        body.velocity.x = forward.x * vF + right.x * vL;
        body.velocity.y = forward.y * vF + right.y * vL;

        this.skid.emitting = drifting;

        const moved = Phaser.Math.Distance.Between(this.lastX, this.lastY, this.player.x, this.player.y);
        tripStatsRef.current.distance += moved;
        this.lastX = this.player.x;
        this.lastY = this.player.y;
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [MainScene],
      backgroundColor: "#050508",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    const handleUnlock = (e: Event) => setUnlocked((e as CustomEvent).detail);
    window.addEventListener("GAME_UNLOCK", handleUnlock);

    return () => {
      window.removeEventListener("GAME_UNLOCK", handleUnlock);
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [vehicleType]);

  const resumePhysics = () => {
    const scene = gameInstance.current?.scene.getScene("MainScene");
    scene?.physics.resume();
  };

  const handleContinue = () => {
    setUnlocked(null);
    resumePhysics();
  };

  const handleViewDetails = () => {
    if (unlocked) router.push(unlocked.route);
  };

  const requestExit = () => {
    const { distance, visited, startTime } = tripStatsRef.current;
    gameInstance.current?.scene.getScene("MainScene")?.physics.pause();
    setTripSummary({
      distance: Math.round(distance / 10),
      stops: visited.size,
      duration: Math.round((Date.now() - startTime) / 1000),
    });
  };

  const keepDriving = () => {
    setTripSummary(null);
    resumePhysics();
  };

  const confirmExit = async () => {
    if (!tripSummary || !vehicleType) return;
    setSubmitting(true);
    try {
      await fetch("/api/game/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType,
          distanceTraveled: tripStatsRef.current.distance,
          stopsVisited: Array.from(tripStatsRef.current.visited),
          durationSeconds: tripSummary.duration,
        }),
      });
    } finally {
      router.push("/");
    }
  };

  /* ── Vehicle selector (Phaser hasn't mounted yet) ── */
  if (!vehicleType) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-10 bg-[#050508] px-6 text-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Choose Your Ride</h1>
          <p className="mt-2 text-sm text-zinc-500">Each vehicle handles differently.</p>
        </div>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {(Object.entries(VEHICLE_STATS) as [VehicleType, VehicleStats][]).map(([type, stats]) => {
            const Icon = type === "motorcycle" ? Bike : type === "car" ? Car : Bus;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVehicleType(type)}
                className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-colors hover:border-red-500/50"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border"
                  style={{ borderColor: `#${stats.color.toString(16)}66`, color: `#${stats.color.toString(16)}` }}
                >
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">{stats.label}</h3>
                <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Top speed {stats.maxSpeed}</span>
                  <span>Turning {stats.turningLabel}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

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
        onClick={requestExit}
        className="absolute right-8 top-8 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors hover:bg-red-500"
      >
        <X size={24} strokeWidth={3} />
      </motion.button>

      {/* ── Instructions ── */}
      {!isLoading && !unlocked && !tripSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            {isTouch ? "Use the joystick to drive" : "WASD or Arrow Keys to drive"}
          </p>
        </motion.div>
      )}

      {/* ── Touch joystick zone ── */}
      {isTouch && !unlocked && !tripSummary && (
        <div ref={joystickZoneRef} className="absolute bottom-0 left-0 z-20 h-48 w-48" />
      )}

      {/* ── Unlock popup ── */}
      <AnimatePresence>
        {unlocked && (
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
              className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-red-500/50 bg-zinc-900/80 p-8 text-center shadow-[0_0_50px_-10px_rgba(220,38,38,0.3)] backdrop-blur-xl"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <Flag size={26} />
              </div>
              <h2 className="mb-2 text-xl font-black uppercase tracking-widest text-white">Congrats! You Unlocked</h2>
              <p className="mb-1 text-lg font-bold text-red-400">{unlocked.name}</p>
              <p className="mb-8 text-sm leading-relaxed text-zinc-400">{unlocked.shortInfo}</p>

              <div className="flex w-full flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewDetails}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
                >
                  <Eye size={16} /> Click to View
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinue}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trip summary ── */}
      <AnimatePresence>
        {tripSummary && (
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
              className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <h2 className="mb-6 text-xl font-black uppercase tracking-widest text-white">Trip Summary</h2>

              <div className="mb-8 grid w-full grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Gauge size={18} className="text-red-400" />
                  <span className="text-lg font-bold text-white">{tripSummary.distance}</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Distance</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Flag size={18} className="text-red-400" />
                  <span className="text-lg font-bold text-white">{tripSummary.stops}/9</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Stops</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Clock size={18} className="text-red-400" />
                  <span className="text-lg font-bold text-white">{tripSummary.duration}s</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Time</span>
                </div>
              </div>

              <div className="mb-6 flex w-full justify-center">
                <Leaderboard game="drive" score={tripSummary.distance} />
              </div>

              <div className="flex w-full flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={submitting}
                  onClick={confirmExit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : "Return Home"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={submitting}
                  onClick={keepDriving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Keep Driving
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
