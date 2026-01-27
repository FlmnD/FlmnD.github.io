// src/room.js
import { ROOM_SIZE, TILE_SIZE, ROOM_PIXEL } from "./levels.js";

function rotCW(tx, ty, N) { return { tx: N - 1 - ty, ty: tx }; }
function rotCCW(tx, ty, N) { return { tx: ty, ty: N - 1 - tx }; }

function cloneGrid(g) { return g.map(row => row.slice()); }
function clonePts(arr) { return arr.map(p => ({ ...p })); }

function rotPoint(p, dir) {
  return (dir > 0) ? rotCW(p.tx, p.ty, ROOM_SIZE) : rotCCW(p.tx, p.ty, ROOM_SIZE);
}

export class Room {
  constructor(layout, index) {
    this.index = index;

    this.worldX = layout.x * ROOM_PIXEL;
    this.worldY = layout.y * ROOM_PIXEL;

    this.solidGrid = Array.from({ length: ROOM_SIZE }, () =>
      Array.from({ length: ROOM_SIZE }, () => ".")
    );

    this.coins = []; 
    this.wind = []; 
    this.plates = []; 
    this.spawn = null; 
    this.door = null;  

    this.platformDefs = [];
    const mpA = [];
    const mpB = [];

    const rows = layout.grid;

    for (let ty = 0; ty < ROOM_SIZE; ty++) {
      const row = rows[ty];
      for (let tx = 0; tx < ROOM_SIZE; tx++) {
        const ch = row[tx] ?? ".";

        if (ch === "#" || ch === "B" || ch === "G" || ch === "M" || ch === "V") {
          this.solidGrid[ty][tx] = ch;
        } else {
          this.solidGrid[ty][tx] = ".";
        }

        if (ch === "C") this.coins.push({ tx, ty, taken: false });
        if (ch === "S") this.spawn = { tx, ty };
        if (ch === "D") this.door = { tx, ty };
        if (ch === "P") this.plates.push({ tx, ty, pressed: false });
        if (ch === "^" || ch === "v" || ch === "<" || ch === ">") this.wind.push({ tx, ty, dir: ch });

        if (ch === "M") mpA.push({ tx, ty });
        if (ch === "V") mpB.push({ tx, ty });
      }
    }

    const pairs = Math.min(mpA.length, mpB.length);
    for (let i = 0; i < pairs; i++) this.platformDefs.push({ a: mpA[i], b: mpB[i] });

    for (const p of [...mpA, ...mpB]) this.solidGrid[p.ty][p.tx] = ".";

    this._baseSolidGrid = cloneGrid(this.solidGrid);
    this._basePlatformDefs = this.platformDefs.map(d => ({ a: { ...d.a }, b: { ...d.b } }));

    this._baseCoins = this.coins.map(c => ({ tx: c.tx, ty: c.ty })); 
    this._baseWind = clonePts(this.wind);
    this._basePlates = this.plates.map(p => ({ tx: p.tx, ty: p.ty }));
    this._baseSpawn = this.spawn ? { ...this.spawn } : null;
    this._baseDoor = this.door ? { ...this.door } : null;

    this.gatesOpen = false;
    this.visualSpin = null; 
  }

  resetSolidsToBase() {
    this.solidGrid = cloneGrid(this._baseSolidGrid);
    this.platformDefs = this._basePlatformDefs.map(d => ({ a: { ...d.a }, b: { ...d.b } }));

    for (let i = 0; i < this.coins.length; i++) {
      const base = this._baseCoins[i];
      if (!base) continue;
      this.coins[i].tx = base.tx;
      this.coins[i].ty = base.ty;
    }

    this.wind = clonePts(this._baseWind);
    this.plates = this._basePlates.map(p => ({ tx: p.tx, ty: p.ty, pressed: false }));
    this.spawn = this._baseSpawn ? { ...this._baseSpawn } : null;
    this.door = this._baseDoor ? { ...this._baseDoor } : null;

    this.gatesOpen = false;
    this.visualSpin = null;
  }

  rotateInstant(dir) {
    const N = ROOM_SIZE;

    const old = this.solidGrid;
    const next = Array.from({ length: N }, () => Array.from({ length: N }, () => "."));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const ch = old[y][x];
        if (ch === ".") continue;
        const p = (dir > 0) ? rotCW(x, y, N) : rotCCW(x, y, N);
        next[p.ty][p.tx] = ch;
      }
    }
    this.solidGrid = next;

    this.platformDefs = this.platformDefs.map(def => {
      const a = rotPoint(def.a, dir);
      const b = rotPoint(def.b, dir);
      return { a, b };
    });

    for (const c of this.coins) {
      const p = rotPoint(c, dir);
      c.tx = p.tx; c.ty = p.ty;
    }
    this.wind = this.wind.map(w => {
      const p = rotPoint(w, dir);
      const dirMapCW = { "^": ">", ">": "v", "v": "<", "<": "^" };
      const dirMapCCW = { "^": "<", "<": "v", "v": ">", ">": "^" };
      const ndir = (dir > 0) ? dirMapCW[w.dir] : dirMapCCW[w.dir];
      return { tx: p.tx, ty: p.ty, dir: ndir };
    });
    this.plates = this.plates.map(pl => {
      const p = rotPoint(pl, dir);
      return { tx: p.tx, ty: p.ty, pressed: false };
    });
    if (this.spawn) {
      const p = rotPoint(this.spawn, dir);
      this.spawn = { tx: p.tx, ty: p.ty };
    }
    if (this.door) {
      const p = rotPoint(this.door, dir);
      this.door = { tx: p.tx, ty: p.ty };
    }
  }

  playVisualSpin(dir, duration = 0.35) {
    this.visualSpin = { t: 0, duration, dir };
  }

  update(dt) {
    if (!this.visualSpin) return;
    this.visualSpin.t += dt;
    if (this.visualSpin.t >= this.visualSpin.duration) this.visualSpin = null;
  }

  getVisualAngle() {
    if (!this.visualSpin) return 0;
    const p = Math.min(1, this.visualSpin.t / this.visualSpin.duration);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    return (Math.PI / 2) * this.visualSpin.dir * e;
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= ROOM_SIZE || ty >= ROOM_SIZE) return ".";
    return this.solidGrid[ty][tx] ?? ".";
  }

  isSolid(tx, ty) {
    const ch = this.tileAt(tx, ty);
    if (ch === ".") return false;
    if (ch === "G" && this.gatesOpen) return false;
    return ch === "#" || ch === "B" || ch === "G";
  }

  tileKind(tx, ty) {
    const ch = this.tileAt(tx, ty);
    if (ch === "G" && this.gatesOpen) return ".";
    return ch;
  }

  tileRect(tx, ty) {
    return {
      x: this.worldX + tx * TILE_SIZE,
      y: this.worldY + ty * TILE_SIZE,
      w: TILE_SIZE,
      h: TILE_SIZE,
    };
  }

  bounds() {
    return { x: this.worldX, y: this.worldY, w: ROOM_PIXEL, h: ROOM_PIXEL };
  }
}
