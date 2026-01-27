// src/scenes/settings.js
import { Button, Slider } from "../ui.js";
import { drawText, drawPanel } from "../utils.js";
import { AudioManager } from "../audio.js";

export class SettingsScene {
  constructor() {
    this.blocksUpdate = true;
    this.buttons = [];
    this.slider = null;
  }

  onEnter() {
    const { width: W, height: H } = this.engine;

    const panelW = 720, panelH = 440;
    this.px = W / 2 - panelW / 2;
    this.py = H / 2 - panelH / 2;

    // volume slider
    const sliderW = 420;
    const sx = W / 2 - sliderW / 2;
    const sy = H / 2 - 10;

    this.slider = new Slider({
      x: sx,
      y: sy,
      w: sliderW,
      h: 14,
      value: AudioManager.getVolume(),
      onChange: (v) => AudioManager.setVolume(v),
    });

    this.buttons = [
      new Button({
        x: W / 2 - 120,
        y: H / 2 + 140,
        w: 240,
        h: 52,
        label: "Back (Esc)",
        onClick: () => this.engine.pop(),
      }),
    ];
  }

  update(dt) {
    if (this.engine.input.pressed("Escape")) this.engine.pop();
    this.slider?.update(this.engine.input);
    for (const b of this.buttons) b.update(this.engine.input);
  }

  draw(ctx) {
    const { width: W, height: H } = this.engine;

    ctx.save();
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    drawPanel(ctx, this.px, this.py, 720, 440, 1.0);

    drawText(ctx, "Settings", W / 2, H / 2 - 180, 38, "rgba(231,238,247,0.95)", "center");
    drawText(ctx, "Music Volume", W / 2, H / 2 - 60, 18, "rgba(231,238,247,0.90)", "center");

    this.slider?.draw(ctx);

    const pct = Math.round((this.slider?.value ?? 0.55) * 100);
    drawText(ctx, `${pct}%`, W / 2, H / 2 + 20, 16, "rgba(231,238,247,0.75)", "center");

    drawText(ctx, "A&D – move   W – jump   E – interact   Q – Rooms page", W / 2, H / 2 + 70, 14, "rgba(231,238,247,0.65)", "center");
    drawText(ctx, "Rooms page: E rotate left   R rotate right   Esc/X close", W / 2, H / 2 + 92, 14, "rgba(231,238,247,0.65)", "center");

    for (const b of this.buttons) b.draw(ctx);
  }
}
