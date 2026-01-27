// src/scenes/credits.js
import { Button } from "../ui.js";
import { drawText, drawPanel } from "../utils.js";

export class CreditsScene {
  constructor() {
    this.buttons = [];
    this.blocksUpdate = true;
  }

  onEnter() {
    const { width: W, height: H } = this.engine;
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
    for (const b of this.buttons) b.update(this.engine.input);
  }

  draw(ctx) {
    const { width: W, height: H } = this.engine;

    ctx.save();
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();


    drawPanel(ctx, W / 2 - 360, H / 2 - 220, 720, 440, 1.0);
    drawText(ctx, "Credits", W / 2, H / 2 - 180, 38, "rgba(231,238,247,0.95)", "center");
    drawText(ctx, "Built with HTML5 Canvas + JavaScript.", W / 2, H / 2 - 40, 16, "rgba(231,238,247,0.65)", "center");

    for (const b of this.buttons) b.draw(ctx);
  }
}
