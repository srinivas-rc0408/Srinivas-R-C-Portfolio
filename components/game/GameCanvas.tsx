"use client";

import { useEffect, useRef, useState } from "react";
import nipplejs from "nipplejs";
import type * as Phaser from "phaser";

interface GameCanvasProps {
  vehicleType: "motorcycle" | "car" | "bus";
}

const PORTFOLIO_SECTIONS = [
  { name: "Resume", slug: "resume", color: 0x8b5cf6 },
  { name: "Projects", slug: "projects", color: 0x3b82f6 },
  { name: "CV", slug: "cv", color: 0x14b8a6 },
  { name: "Skills", slug: "skills", color: 0x22c55e },
  { name: "Experience", slug: "experience", color: 0xf59e0b },
  { name: "Education", slug: "education", color: 0xec4899 },
  { name: "Certifications", slug: "certifications", color: 0xf97316 },
  { name: "Open Source", slug: "open-source", color: 0x9ca3af },
  { name: "Contact", slug: "contact", color: 0xf87171 },
];

export default function GameCanvas({ vehicleType }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: Phaser.Game;

    // We must dynamic import phaser so it doesn't crash on SSR, even though we use next/dynamic
    import("phaser").then(({ default: Phaser }) => {
      class MainScene extends Phaser.Scene {
        private player!: Phaser.Physics.Arcade.Image;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private speed: number = 0;
        private currentTurn: number = 0;
        private activeJoystickData: { vector: { x: number; y: number } } | null = null;
        private lastOverlappedSlug: string | null = null;

        constructor() {
          super({ key: "MainScene" });
        }

        preload() {
          // Programmatically generate simple geometric textures
          const graphics = this.make.graphics({ x: 0, y: 0 });

          // Grass texture
          graphics.fillStyle(0x0a2f1a, 1);
          graphics.fillRect(0, 0, 64, 64);
          graphics.generateTexture("grass", 64, 64);
          graphics.clear();

          // Road texture
          graphics.fillStyle(0x2a2a35, 1);
          graphics.fillRect(0, 0, 64, 64);
          // Road lines
          graphics.fillStyle(0x444455, 1);
          graphics.fillRect(30, 0, 4, 64);
          graphics.generateTexture("road", 64, 64);
          graphics.clear();

          // Motorcycle
          graphics.fillStyle(0xffffff, 1);
          graphics.fillRect(0, 0, 8, 16);
          graphics.generateTexture("motorcycle", 8, 16);
          graphics.clear();

          // Car
          graphics.fillStyle(0x6c63ff, 1);
          graphics.fillRect(0, 0, 16, 24);
          graphics.generateTexture("car", 16, 24);
          graphics.clear();

          // Bus
          graphics.fillStyle(0xf59e0b, 1);
          graphics.fillRect(0, 0, 24, 48);
          graphics.generateTexture("bus", 24, 48);
          graphics.clear();

          // Bus Stop Box
          graphics.fillStyle(0xffffff, 0.2);
          graphics.lineStyle(2, 0xffffff, 0.8);
          graphics.fillRect(0, 0, 60, 60);
          graphics.strokeRect(0, 0, 60, 60);
          graphics.generateTexture("bus_stop", 60, 60);
          graphics.clear();
        }

        create() {
          // Generate a simple looping track (road surrounded by grass)
          const mapSize = 2000;
          this.physics.world.setBounds(0, 0, mapSize, mapSize);

          this.add.tileSprite(mapSize / 2, mapSize / 2, mapSize, mapSize, "grass");

          // Draw road layout (figure 8 or large loop)
          this.add.tileSprite(mapSize / 2, 200, mapSize - 400, 100, "road");
          this.add.tileSprite(mapSize / 2, mapSize - 200, mapSize - 400, 100, "road");
          this.add.tileSprite(200, mapSize / 2, 100, mapSize - 400, "road").setAngle(90);
          this.add.tileSprite(mapSize - 200, mapSize / 2, 100, mapSize - 400, "road").setAngle(90);

          // Place player
          this.player = this.physics.add.image(mapSize / 2, mapSize - 200, vehicleType);
          this.player.setCollideWorldBounds(true);
          
          // Vehicle Profiles
          const profiles = {
            motorcycle: { maxVel: 300, drag: 200, angular: 200, accel: 300 },
            car: { maxVel: 200, drag: 400, angular: 150, accel: 200 },
            bus: { maxVel: 120, drag: 600, angular: 90, accel: 100 },
          };
          const profile = profiles[vehicleType];

          this.player.setMaxVelocity(profile.maxVel);
          this.player.setDamping(true);
          this.player.setDrag(0.95);

          // Camera setup
          this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
          this.cameras.main.setZoom(1.5);
          
          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
          }

          // Create Bus Stops
          const busStops = this.physics.add.staticGroup();
          
          const stopPositions = [
            { x: 300, y: 200 }, { x: mapSize / 2, y: 200 }, { x: mapSize - 300, y: 200 },
            { x: mapSize - 200, y: 600 }, { x: mapSize - 200, y: mapSize / 2 }, { x: mapSize - 200, y: mapSize - 600 },
            { x: mapSize - 300, y: mapSize - 200 }, { x: mapSize / 2, y: mapSize - 200 }, { x: 300, y: mapSize - 200 }
          ];

          PORTFOLIO_SECTIONS.forEach((section, index) => {
            if (index < stopPositions.length) {
              const pos = stopPositions[index];
              const stop = busStops.create(pos.x, pos.y, "bus_stop") as Phaser.Physics.Arcade.Sprite;
              stop.setData("name", section.name);
              stop.setData("slug", section.slug);
              
              // Add a floating text label
              this.add.text(pos.x, pos.y - 40, section.name, {
                fontSize: "14px",
                color: "#ffffff",
                fontStyle: "bold"
              }).setOrigin(0.5);
            }
          });

          // Overlap check
          this.physics.add.overlap(this.player, busStops, (player, stopObject) => {
            const stop = stopObject as Phaser.Physics.Arcade.Sprite;
            const slug = stop.getData("slug");
            const name = stop.getData("name");

            if (this.lastOverlappedSlug !== slug) {
              this.lastOverlappedSlug = slug;
              window.dispatchEvent(new CustomEvent("busStopEntered", { 
                detail: { stopName: name, slug: slug } 
              }));
            }
          });

          // Setup Mobile Joystick
          const isMobile = navigator.maxTouchPoints > 0;
          if (isMobile && joystickRef.current) {
            const manager = nipplejs.create({
              zone: joystickRef.current,
              mode: "static",
              position: { left: "50%", bottom: "50px" },
              color: "#6c63ff"
            });
            manager.on("move", (evt: any, data: any) => {
              this.activeJoystickData = { vector: data.vector };
            });
            manager.on("end", () => {
              this.activeJoystickData = null;
            });
          }
        }

        update() {
          const profile = {
            motorcycle: { accel: 300, turn: 200 },
            car: { accel: 200, turn: 150 },
            bus: { accel: 100, turn: 90 },
          }[vehicleType];

          let isAccelerating = false;

          // Keyboard input
          const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
          if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.player.rotation - Math.PI / 2, profile.accel, playerBody.acceleration);
            isAccelerating = true;
          } else if (this.cursors.down.isDown) {
            this.physics.velocityFromRotation(this.player.rotation - Math.PI / 2, -profile.accel / 2, playerBody.acceleration);
            isAccelerating = true;
          } else {
            this.player.setAcceleration(0);
          }

          if (this.cursors.left.isDown) {
            this.player.setAngularVelocity(-profile.turn);
          } else if (this.cursors.right.isDown) {
            this.player.setAngularVelocity(profile.turn);
          } else {
            this.player.setAngularVelocity(0);
          }

          // Joystick override for mobile
          if (this.activeJoystickData) {
            const { x, y } = this.activeJoystickData.vector;
            const angle = Math.atan2(y, x);
            
            // Map joystick rotation to vehicle
            this.player.rotation = angle + Math.PI / 2;
            this.physics.velocityFromRotation(angle, profile.accel, playerBody.acceleration);
            isAccelerating = true;
          }

          // Clear overlap if moving away
          if (isAccelerating && this.lastOverlappedSlug) {
             // Let it clear roughly if velocity > 10
             if (playerBody.velocity.length() > 50) {
                 this.lastOverlappedSlug = null;
             }
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        parent: containerRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [MainScene],
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
          },
        },
        fps: {
          target: 60,
          forceSetTimeOut: true
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
        }
      };

      game = new Phaser.Game(config);
    });
    const joystickContainer = joystickRef.current;

    return () => {
      if (game) {
        game.destroy(true);
      }
      if (joystickContainer) {
        joystickContainer.innerHTML = '';
      }
    };
  }, [vehicleType]);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 z-0 bg-[#000000]" />
      <div ref={joystickRef} className="fixed bottom-0 left-0 w-full h-40 z-10 sm:hidden pointer-events-auto" />
    </>
  );
}
