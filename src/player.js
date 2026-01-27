// src/player.js
import { clamp } from "./utils.js";
import { ROOM_PIXEL } from "./levels.js";

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 22;
    this.h = 28;

    this.vx = 0;
    this.vy = 0;

    this.onGround = false;

    this.maxSpeed = 260;
    this.accel = 1900;
    this.friction = 2200;
    this.gravity = 1800;

    this.jumpVel = 700;
    this.bounceVel = 820;

    this.coyote = 0;
    this.coyoteMax = 0.10;
    this.jumpBuf = 0;
    this.jumpBufMax = 0.12;
    this.jumpHeld = false;

    this._ridingPlatform = null;
  }

  aabb() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  update(dt, input, world) {

    if (this._ridingPlatform) {
      const p = this._ridingPlatform;
      const room = world.rooms[p.roomIndex];
      if (room) {
        const minX = room.worldX + 2;
        const maxX = room.worldX + ROOM_PIXEL - this.w - 2;
        const minY = room.worldY + 2;
        const maxY = room.worldY + ROOM_PIXEL - this.h - 2;

        const dx = p.vx * dt;
        const dy = p.vy * dt;

        if (dx !== 0) {
          const nx = clamp(this.x + dx, minX, maxX);
          const test = { x: nx, y: this.y, w: this.w, h: this.h };
          if (!world.collideAABB(test, { includePlatforms: false })) {
            this.x = nx;
          }
        }

        if (dy !== 0) {
          const ny = clamp(this.y + dy, minY, maxY);
          const test = { x: this.x, y: ny, w: this.w, h: this.h };
          if (!world.collideAABB(test, { includePlatforms: false })) {
            this.y = ny;
          }
        }
      }
    }

    this._ridingPlatform = null;

    const left = input.down("a") || input.down("ArrowLeft");
    const right = input.down("d") || input.down("ArrowRight");
    const move = (right ? 1 : 0) - (left ? 1 : 0);

    const jumpPress = input.pressed("w") || input.pressed("ArrowUp");
    const jumpDown = input.down("w") || input.down("ArrowUp");
    const jumpRelease = this.jumpHeld && !jumpDown;
    this.jumpHeld = jumpDown;

    if (jumpPress) this.jumpBuf = this.jumpBufMax;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    if (this.onGround) this.coyote = this.coyoteMax;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (move !== 0) {
      this.vx += move * this.accel * dt;
      this.vx = clamp(this.vx, -this.maxSpeed, this.maxSpeed);
    } else {
      const s = Math.sign(this.vx);
      const dv = this.friction * dt;
      if (Math.abs(this.vx) <= dv) this.vx = 0;
      else this.vx -= s * dv;
    }

    const wind = world.windAccelForAABB(this.aabb());
    this.vx += wind.ax * dt;
    this.vy += wind.ay * dt;

    this.vy += this.gravity * dt;

    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = -this.jumpVel;
      this.onGround = false;
      this.jumpBuf = 0;
      this.coyote = 0;
    }

    if (jumpRelease && this.vy < 0) {
      this.vy *= 0.55;
    }

    this.x += this.vx * dt;
    let hit = world.collideAABB(this.aabb(), { includePlatforms: false });
    if (hit) {
      if (this.vx > 0) this.x = hit.rect.x - this.w;
      else if (this.vx < 0) this.x = hit.rect.x + hit.rect.w;
      this.vx = 0;
    }

    const prevBottom = this.y + this.h;
    this.y += this.vy * dt;

    hit = world.collideAABB(this.aabb(), { includePlatforms: true });

    if (hit && hit.kind === "platform") {
      const platformTop = hit.rect.y;
      const falling = this.vy >= 0;
      const comingFromAbove = prevBottom <= platformTop + 2;
      if (!(falling && comingFromAbove)) {
        hit = world.collideAABB(this.aabb(), { includePlatforms: false });
      }
    }

    if (hit) {
      if (this.vy > 0) {
        this.y = hit.rect.y - this.h;
        this.vy = 0;
        this.onGround = true;

        if (hit.kind === "tile" && hit.tile === "B") {
          this.vy = -this.bounceVel;
          this.onGround = false;
        }

        if (hit.kind === "platform") {
          this._ridingPlatform = hit.platform;
        }
      } else if (this.vy < 0) {
        this.y = hit.rect.y + hit.rect.h;
        this.vy = 0;
      }
    } else {
      this.onGround = false;
    }
  }
}
