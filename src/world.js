// src/world.js
import { ROOM_SIZE, TILE_SIZE, ROOM_PIXEL } from "./levels.js";
import { Room } from "./room.js";
import { clamp } from "./utils.js";

function aabbIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function lerp(a, b, t) { return a + (b - a) * t; }

export class World {
  constructor(levelDef) {
    this.levelDef = levelDef;
    this.rooms = levelDef.rooms.map((layout, i) => new Room(layout, i));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of this.rooms) {
      minX = Math.min(minX, r.worldX);
      minY = Math.min(minY, r.worldY);
      maxX = Math.max(maxX, r.worldX + ROOM_PIXEL);
      maxY = Math.max(maxY, r.worldY + ROOM_PIXEL);
    }
    this.bounds = { minX, minY, maxX, maxY };

    this.platforms = [];
    this._buildPlatforms();
  }

  resetRotations() {
    for (const r of this.rooms) r.resetSolidsToBase();
    this._buildPlatforms();
  }

  _buildPlatforms() {
    this.platforms.length = 0;

    for (const room of this.rooms) {
      for (const def of room.platformDefs) {
        const x1 = room.worldX + def.a.tx * TILE_SIZE;
        const y1 = room.worldY + def.a.ty * TILE_SIZE;
        const x2 = room.worldX + def.b.tx * TILE_SIZE;
        const y2 = room.worldY + def.b.ty * TILE_SIZE;

        const w = TILE_SIZE * 3;
        const h = TILE_SIZE * 0.6;

        this.platforms.push({
          roomIndex: room.index,
          x1, y1, x2, y2,
          p: 0,
          dir: 1,
          speed: 0.35,
          x: x1, y: y1,
          w, h,
          vx: 0, vy: 0,
        });
      }
    }
  }

  onRoomRotated(roomIndex) {
    const room = this.rooms[roomIndex];
    const old = this.platforms.filter(p => p.roomIndex === roomIndex);

    this.platforms = this.platforms.filter(p => p.roomIndex !== roomIndex);

    for (let i = 0; i < room.platformDefs.length; i++) {
      const def = room.platformDefs[i];
      const prev = old[i];

      const x1 = room.worldX + def.a.tx * TILE_SIZE;
      const y1 = room.worldY + def.a.ty * TILE_SIZE;
      const x2 = room.worldX + def.b.tx * TILE_SIZE;
      const y2 = room.worldY + def.b.ty * TILE_SIZE;

      const w = TILE_SIZE * 3;
      const h = TILE_SIZE * 0.6;

      const p = prev ? prev.p : 0;
      const dir = prev ? prev.dir : 1;
      const speed = prev ? prev.speed : 0.35;

      const x = lerp(x1, x2, p);
      const y = lerp(y1, y2, p);

      this.platforms.push({
        roomIndex,
        x1, y1, x2, y2,
        p,
        dir,
        speed,
        x, y,
        w, h,
        vx: 0, vy: 0,
      });
    }
  }

  totalCoins() {
    let n = 0;
    for (const r of this.rooms) n += r.coins.length;
    return n;
  }

  collectedCoins() {
    let n = 0;
    for (const r of this.rooms) for (const c of r.coins) if (c.taken) n++;
    return n;
  }

  update(dt, playerAABB) {
    for (const p of this.platforms) {
      const prevX = p.x, prevY = p.y;

      if (dt > 0) {
        p.p += dt * p.speed * p.dir;
        if (p.p >= 1) { p.p = 1; p.dir = -1; }
        if (p.p <= 0) { p.p = 0; p.dir = 1; }

        p.x = lerp(p.x1, p.x2, p.p);
        p.y = lerp(p.y1, p.y2, p.p);

        p.vx = (p.x - prevX) / dt;
        p.vy = (p.y - prevY) / dt;
      } else {
        p.vx = 0; p.vy = 0;
      }
    }

    if (!playerAABB) return;

    for (const room of this.rooms) {
      let pressed = false;
      for (const pl of room.plates) {
        const rect = room.tileRect(pl.tx, pl.ty);
        const inset = 4;
        const rr = { x: rect.x + inset, y: rect.y + inset, w: rect.w - inset * 2, h: rect.h - inset * 2 };
        pl.pressed = aabbIntersect(playerAABB, rr);
        if (pl.pressed) pressed = true;
      }
      room.gatesOpen = room.gatesOpen || pressed; 
    }
  }

  windAccelForAABB(aabb) {
    const MAG = 1400;
    let ax = 0, ay = 0;
    for (const room of this.rooms) {
      for (const w of room.wind) {
        const rect = room.tileRect(w.tx, w.ty);
        if (!aabbIntersect(aabb, rect)) continue;
        if (w.dir === "<") ax -= MAG;
        if (w.dir === ">") ax += MAG;
        if (w.dir === "^") ay -= MAG;
        if (w.dir === "v") ay += MAG;
      }
    }
    return { ax, ay };
  }

  roomIndexAtPoint(x, y) {
    for (const r of this.rooms) {
      if (x >= r.worldX && x < r.worldX + ROOM_PIXEL && y >= r.worldY && y < r.worldY + ROOM_PIXEL) {
        return r.index;
      }
    }
    return 0;
  }

  roomIndexForAABB(aabb) {
    const cx = aabb.x + aabb.w / 2;
    const cy = aabb.y + aabb.h / 2;
    return this.roomIndexAtPoint(cx, cy);
  }

  collideAABB(aabb, opts = {}) {
    const includePlatforms = (opts.includePlatforms !== false);

    if (includePlatforms) {
      for (const p of this.platforms) {
        const rect = { x: p.x, y: p.y, w: p.w, h: p.h };
        if (aabbIntersect(aabb, rect)) {
          return { kind: "platform", rect, platform: p };
        }
      }
    }

    for (const room of this.rooms) {
      const rb = room.bounds();
      if (!aabbIntersect(aabb, rb)) continue;

      const tx0 = clamp(Math.floor((aabb.x - room.worldX) / TILE_SIZE) - 1, 0, ROOM_SIZE - 1);
      const ty0 = clamp(Math.floor((aabb.y - room.worldY) / TILE_SIZE) - 1, 0, ROOM_SIZE - 1);
      const tx1 = clamp(Math.floor((aabb.x + aabb.w - room.worldX) / TILE_SIZE) + 1, 0, ROOM_SIZE - 1);
      const ty1 = clamp(Math.floor((aabb.y + aabb.h - room.worldY) / TILE_SIZE) + 1, 0, ROOM_SIZE - 1);

      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!room.isSolid(tx, ty)) continue;
          const rect = room.tileRect(tx, ty);
          if (aabbIntersect(aabb, rect)) {
            return { kind: "tile", rect, tile: room.tileKind(tx, ty), roomIndex: room.index, tx, ty };
          }
        }
      }
    }

    return null;
  }

  tryCollectCoins(playerAABB) {
    let got = 0;
    for (const room of this.rooms) {
      for (const c of room.coins) {
        if (c.taken) continue;
        const rect = room.tileRect(c.tx, c.ty);
        const rr = { x: rect.x + 6, y: rect.y + 6, w: rect.w - 12, h: rect.h - 12 };
        if (aabbIntersect(playerAABB, rr)) {
          c.taken = true;
          got++;
        }
      }
    }
    return got;
  }

  doorRect() {
    for (const room of this.rooms) {
      if (!room.door) continue;
      const r = room.tileRect(room.door.tx, room.door.ty);
      return { x: r.x, y: r.y, w: r.w, h: r.h, roomIndex: room.index };
    }
    return null;
  }

  spawnPoint() {
    for (const r of this.rooms) if (r.spawn) {
      return {
        x: r.worldX + r.spawn.tx * TILE_SIZE + TILE_SIZE * 0.5,
        y: r.worldY + r.spawn.ty * TILE_SIZE + TILE_SIZE * 0.5,
      };
    }
    return { x: this.bounds.minX + TILE_SIZE * 2, y: this.bounds.minY + TILE_SIZE * 2 };
  }
}
