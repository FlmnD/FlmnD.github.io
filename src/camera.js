// src/camera.js
import { clamp, lerp } from "./utils.js";

export class Camera {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.x = 0;
    this.y = 0;
    this._tx = 0;
    this._ty = 0;
  }

  follow(px, py, bounds) {
    this._tx = px - this.w / 2;
    this._ty = py - this.h / 2;

    this.x = lerp(this.x, this._tx, 0.12);
    this.y = lerp(this.y, this._ty, 0.12);

    const minX = bounds.minX;
    const minY = bounds.minY;
    const maxX = bounds.maxX - this.w;
    const maxY = bounds.maxY - this.h;

    this.x = clamp(this.x, minX, Math.max(minX, maxX));
    this.y = clamp(this.y, minY, Math.max(minY, maxY));
  }
}
