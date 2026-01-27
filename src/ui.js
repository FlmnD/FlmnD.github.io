// src/ui.js
import { drawPanel, drawText, roundRect } from "./utils.js";
import { Theme } from "./assets.js";

export class Button {
  constructor({x,y,w,h,label,onClick, hotkey=null}) {
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.label=label;
    this.onClick=onClick;
    this.hotkey=hotkey;
    this.disabled=false;
  }
  contains(mx,my){ return mx>=this.x && mx<=this.x+this.w && my>=this.y && my<=this.y+this.h; }
  update(input){
    if (this.disabled) return;
    if (this.hotkey && input.pressed(this.hotkey)) this.onClick?.();
    if (input.mouse.pressed && this.contains(input.mouse.x, input.mouse.y)) this.onClick?.();
  }
  draw(ctx){
    ctx.save();
    const fill = this.disabled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)";
    drawPanel(ctx, this.x, this.y, this.w, this.h, 0.45);
    ctx.fillStyle = fill;
    roundRect(ctx, this.x, this.y, this.w, this.h, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();
    drawText(ctx, this.label, this.x+this.w/2, this.y+this.h/2-10, 18, "rgba(231,238,247,0.95)", "center");
    ctx.restore();
  }
}

export class BannerMessage {
  constructor(text, ttl=2.4, kind="info") {
    this.text = text;
    this.ttl = ttl;
    this.kind = kind;
  }
  update(dt){ this.ttl -= dt; }
  alive(){ return this.ttl > 0; }
  draw(ctx, x, y, w){
    const color = this.kind==="error" ? Theme.ui.danger : (this.kind==="ok" ? Theme.ui.ok : Theme.ui.accent);
    drawPanel(ctx, x, y, w, 56, 0.75);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x+14, y+46);
    ctx.lineTo(x+w-14, y+46);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, this.text, x+16, y+16, 16);
  }
}

export class Slider {
  constructor({ x, y, w, h = 12, value = 0.5, onChange = null }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.value = Math.max(0, Math.min(1, value));
    this.onChange = onChange;

    this.dragging = false;
    this.knobR = 10;
  }

  _trackRect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  _knobCenter() {
    return {
      cx: this.x + this.value * this.w,
      cy: this.y + this.h / 2
    };
  }

  _containsTrack(mx, my) {
    const r = this._trackRect();
    return mx >= r.x && mx <= r.x + r.w && my >= r.y - 8 && my <= r.y + r.h + 8;
  }

  _containsKnob(mx, my) {
    const { cx, cy } = this._knobCenter();
    const dx = mx - cx;
    const dy = my - cy;
    return (dx * dx + dy * dy) <= (this.knobR + 6) * (this.knobR + 6);
  }

  _setFromMouse(mx) {
    const t = (mx - this.x) / this.w;
    const nv = Math.max(0, Math.min(1, t));
    if (nv !== this.value) {
      this.value = nv;
      this.onChange?.(this.value);
    }
  }

  update(input) {
    const mx = input.mouse.x, my = input.mouse.y;

    if (input.mouse.pressed) {
      if (this._containsKnob(mx, my) || this._containsTrack(mx, my)) {
        this.dragging = true;
        this._setFromMouse(mx);
      }
    }

    if (this.dragging && input.mouse.down) {
      this._setFromMouse(mx);
    }

    if (this.dragging && input.mouse.released) {
      this.dragging = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "rgba(120,166,255,0.55)";
    ctx.fillRect(this.x, this.y, this.w * this.value, this.h);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.w - 1, this.h - 1);

    const { cx, cy } = this._knobCenter();
    ctx.beginPath();
    ctx.arc(cx, cy, this.knobR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(231,238,247,0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();

    ctx.restore();
  }
}

