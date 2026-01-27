// src/scenes/play.js
import { LEVELS, ROOM_PIXEL } from "../levels.js";
import { World } from "../world.js";
import { Player } from "../player.js";
import { Renderer } from "../renderer.js";
import { Camera } from "../camera.js";
import { BannerMessage } from "../ui.js";
import { drawPanel, drawText, aabbIntersect, clamp } from "../utils.js";

import { RoomsOverlayScene } from "./rooms_overlay.js";
import { CutsceneScene } from "./cutscene.js";
import { CelebrationScene } from "./celebration.js";
import { LevelSelectScene } from "./level_select.js";

import { STORY } from "../story.js";
import { AudioManager } from "../audio.js";
import { formatTimeMs } from "../progress.js";

export class GameplayScene {
  constructor(levelId = 1) {
    this.levelId = levelId;

    this.world = null;
    this.player = null;
    this.renderer = null;
    this.camera = null;

    this.currentRoomIndex = 0;
    this.maxVisitedRoom = 0;

    this.banners = [];

    this.tries = 0; 
    this._started = false;
    this._runStartMs = 0;
    this._runTimeMs = 0;

    this._doorHold = 0;
    this._doorHoldNeed = 0.7; 
    this._nearDoor = false;
    this._needCoins = 0;

    this.onRoomsOverlayClosed = () => { };
  }

  onEnter() {
    AudioManager.setDesired("game");

    const level = LEVELS[this.levelId - 1];
    if (!level) {
      this.engine.replace(new LevelSelectScene());
      return;
    }

    this.world = new World(level);

    const sp = this.world.spawnPoint();
    this.player = new Player(sp.x - 11, sp.y - 14);

    this.renderer = new Renderer();
    this.camera = new Camera(this.engine.width, this.engine.height);

    this.currentRoomIndex = this.world.roomIndexForAABB(this.player.aabb());
    this.maxVisitedRoom = this.currentRoomIndex;

    const startCutscene =
      this.levelId === 1 ? STORY.level1_intro :
        this.levelId === 3 ? STORY.level3_gate :
          null;

    if (startCutscene) {
      this._started = false;
      this._runTimeMs = 0;

      this.engine.push(new CutsceneScene(startCutscene, {
        holdToSkipSeconds: 2,
        onFinish: () => this._startRunTimer()
      }));
    } else {
      this._startRunTimer();
    }

    if (level.tutorial) {
      this.banners.push(new BannerMessage("W / ↑ to jump. A/D or ←/→ to move.", 3.0, "info"));
      this.banners.push(new BannerMessage("Press Q to open the Rooms page.", 3.0, "info"));
      this.banners.push(new BannerMessage("Collect all coins, then hold E at the door.", 3.2, "info"));
    }
  }

  _startRunTimer() {
    this._started = true;
    this._runStartMs = performance.now();
    this._runTimeMs = 0;
  }

  applyRoomRotation(roomIndex, dir) {
    const room = this.world.rooms[roomIndex];
    if (!room) return;

    room.rotateInstant(dir);
    room.playVisualSpin(dir, 0.35);

    this.world.onRoomRotated(roomIndex);

    const pr = this.world.roomIndexForAABB(this.player.aabb());
    if (pr === roomIndex) {
      this._rotatePlayerInRoom(room, dir);
    }
  }

  _rotatePlayerInRoom(room, dir) {
    const rcx = room.worldX + ROOM_PIXEL / 2;
    const rcy = room.worldY + ROOM_PIXEL / 2;

    const pcx = this.player.x + this.player.w / 2;
    const pcy = this.player.y + this.player.h / 2;

    const dx = pcx - rcx;
    const dy = pcy - rcy;

    const ndx = (dir > 0) ? dy : -dy;
    const ndy = (dir > 0) ? -dx : dx;

    const npcx = rcx + ndx;
    const npcy = rcy + ndy;

    this.player.x = npcx - this.player.w / 2;
    this.player.y = npcy - this.player.h / 2;

    const vx = this.player.vx, vy = this.player.vy;
    if (dir > 0) {
      this.player.vx = vy;
      this.player.vy = -vx;
    } else {
      this.player.vx = -vy;
      this.player.vy = vx;
    }

    const minX = room.worldX + 2;
    const maxX = room.worldX + ROOM_PIXEL - this.player.w - 2;
    const minY = room.worldY + 2;
    const maxY = room.worldY + ROOM_PIXEL - this.player.h - 2;

    this.player.x = Math.max(minX, Math.min(maxX, this.player.x));
    this.player.y = Math.max(minY, Math.min(maxY, this.player.y));

    const baseX = this.player.x, baseY = this.player.y;
    const step = 4;
    const maxR = 64;

    const trySpot = (x, y) => {
      this.player.x = x; this.player.y = y;

      const hit = this.world.collideAABB(this.player.aabb(), { includePlatforms: false });
      if (!hit) return true;

      return false;
    };

    if (trySpot(baseX, baseY)) return;

    for (let r = step; r <= maxR; r += step) {
      const candidates = [
        [baseX, baseY - r],
        [baseX + r, baseY],
        [baseX - r, baseY],
        [baseX, baseY + r],
        [baseX + r, baseY - r],
        [baseX - r, baseY - r],
        [baseX + r, baseY + r],
        [baseX - r, baseY + r],
      ];

      for (const [x0, y0] of candidates) {
        const x = Math.max(minX, Math.min(maxX, x0));
        const y = Math.max(minY, Math.min(maxY, y0));
        if (trySpot(x, y)) return;
      }
    }

    this.player.x = rcx - this.player.w / 2;
    this.player.y = rcy - this.player.h / 2;
    this.player.vx = 0;
    this.player.vy = 0;
  }

  _respawn() {
    this.tries += 1;

    this.world.resetRotations();

    const sp = this.world.spawnPoint();
    this.player.x = sp.x - this.player.w / 2;
    this.player.y = sp.y - this.player.h / 2;
    this.player.vx = 0;
    this.player.vy = 0;

    this._doorHold = 0;
    this.banners.push(new BannerMessage(`Respawned. Tries: ${this.tries}`, 1.2, "info"));
  }

  update(dt) {
    const input = this.engine.input;

    if (input.pressed("Escape")) {
      input.consume("Escape");
      this.engine.replace(new LevelSelectScene());
      return;
    }

    if (input.pressed("q")) {
      input.consume("q");
      this.engine.push(new RoomsOverlayScene(this));
      return;
    }

    if (this._started) this._runTimeMs = performance.now() - this._runStartMs;

    for (const r of this.world.rooms) r.update(dt);

    this.world.update(dt, this.player.aabb());

    this.player.update(dt, input, this.world);

    this._clampPlayerToBounds();

    const got = this.world.tryCollectCoins(this.player.aabb());
    if (got > 0) {
      AudioManager.playSfx("coin", 0.6);
      this.banners.push(new BannerMessage(`+${got} coin${got > 1 ? "s" : ""}!`, 1.0, "ok"));
    }


    if (this.player.y > this.world.bounds.maxY + 420) {
      this._respawn();
      return;
    }

    this.currentRoomIndex = this.world.roomIndexForAABB(this.player.aabb());
    this.maxVisitedRoom = Math.max(this.maxVisitedRoom, this.currentRoomIndex);

    this._updateDoor(dt, input);

    for (const b of this.banners) b.update(dt);
    this.banners = this.banners.filter(b => b.alive());
  }

  _clampPlayerToBounds() {
    const b = this.world.bounds;

    if (this.player.x < b.minX) {
      this.player.x = b.minX;
      this.player.vx = 0;
    }
    if (this.player.x + this.player.w > b.maxX) {
      this.player.x = b.maxX - this.player.w;
      this.player.vx = 0;
    }

    if (this.player.y < b.minY) {
      this.player.y = b.minY;
      this.player.vy = 0;
    }
  }

  _updateDoor(dt, input) {
    const door = this.world.doorRect();
    this._nearDoor = false;
    this._needCoins = 0;

    if (!door) {
      this._doorHold = 0;
      return;
    }

    const aabb = this.player.aabb();
    const near = {
      x: door.x - 22,
      y: door.y - 44,
      w: door.w + 44,
      h: door.h + 72,
    };

    const nearDoor = aabbIntersect(aabb, near);
    this._nearDoor = nearDoor;

    const total = this.world.totalCoins();
    const collected = this.world.collectedCoins();
    const haveAll = collected >= total;

    if (!haveAll) this._needCoins = Math.max(0, total - collected);

    if (nearDoor && input.down("e")) {
      this._doorHold += dt;
      this._doorHold = clamp(this._doorHold, 0, this._doorHoldNeed);
    } else {
      this._doorHold = 0;
    }

    if (nearDoor && this._doorHold >= this._doorHoldNeed) {
      this._doorHold = 0;

      if (!haveAll) {
        this.banners.push(new BannerMessage(`You need ${this._needCoins} more coin${this._needCoins === 1 ? "" : "s"}!`, 1.7, "error"));
        return;
      }

      const runTimeMs = Math.round(this._runTimeMs);
      const runTries = this.tries;

      if (this.levelId === 3) {
        this.engine.push(new CutsceneScene(STORY.level3_ending, {
          holdToSkipSeconds: 2,
          onFinish: () => {
            this.engine.replace(new CelebrationScene({ levelId: this.levelId, runTimeMs, runTries }));
          }
        }));
      } else {
        this.engine.replace(new CelebrationScene({ levelId: this.levelId, runTimeMs, runTries }));
      }
    }
  }

  draw(ctx) {
    this.camera.follow(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      this.world.bounds
    );

    this.renderer.drawWorld(ctx, this.world, this.camera);
    this.renderer.drawPlayer(ctx, this.player, this.camera);

    const total = this.world.totalCoins();
    const collected = this.world.collectedCoins();

    drawPanel(ctx, 16, 16, 260, 98, 0.70);
    drawText(ctx, `Coins: ${collected}/${total}`, 28, 28, 16);
    drawText(ctx, `Tries: ${this.tries}`, 28, 50, 16);
    drawText(ctx, `Time: ${formatTimeMs(this._runTimeMs)}`, 28, 72, 16);

    if (this._nearDoor) {
      const W = this.engine.width;
      const y = this.engine.height - 92;
      const msg = this._needCoins > 0
        ? `Need ${this._needCoins} more coin${this._needCoins === 1 ? "" : "s"}`
        : `Hold E to open`;

      drawPanel(ctx, W / 2 - 210, y, 420, 64, 0.78);
      drawText(ctx, msg, W / 2, y + 18, 18, "rgba(231,238,247,0.95)", "center");

      const pct = this._doorHold / this._doorHoldNeed;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(W / 2 - 170, y + 44, 340, 8);
      ctx.fillStyle = "rgba(120,166,255,0.70)";
      ctx.fillRect(W / 2 - 170, y + 44, 340 * pct, 8);
      ctx.restore();
    }

    let by = 16;
    for (const b of this.banners.slice(-3)) {
      b.draw(ctx, this.engine.width - 16 - 380, by, 380);
      by += 64;
    }

    drawText(ctx, "Q: Rooms page   Esc: Level Select", 16, this.engine.height - 28, 14, "rgba(231,238,247,0.65)");
  }
}
