// src/scenes/menu.js
import { Button } from "../ui.js";
import { drawText, drawPanel } from "../utils.js";
import { LevelSelectScene } from "./level_select.js";
import { SettingsScene } from "./settings.js";
import { CreditsScene } from "./credits.js";
import { AudioManager } from "../audio.js";


export class MenuScene {
  constructor() {
    this.buttons = [];
  }

  onEnter() {
    const { width: W, height: H } = this.engine;
    const bw = 260, bh = 54;
    const cx = W / 2 - bw / 2;
    const y0 = H / 2 - 90;

    AudioManager.setDesired("menu");

    this.buttons = [
      new Button({ x: cx, y: y0, w: bw, h: bh, label: "Play", onClick: () => this.engine.replace(new LevelSelectScene()) }),
      new Button({ x: cx, y: y0 + 70, w: bw, h: bh, label: "Settings", onClick: () => this.engine.push(new SettingsScene()) }),
      new Button({ x: cx, y: y0 + 140, w: bw, h: bh, label: "Credits", onClick: () => this.engine.push(new CreditsScene()) }),
    ];
  }

  update(dt) {
    for (const b of this.buttons) b.update(this.engine.input);
  }

  draw(ctx) {
    const { width: W, height: H } = this.engine;
    drawPanel(ctx, W / 2 - 340, H / 2 - 210, 680, 420, 0.55);
    drawText(ctx, "SuperSpin", W / 2, H / 2 - 170, 44, "rgba(231,238,247,0.95)", "center");
    drawText(ctx, "2D Platformer ", W / 2, H / 2 - 110, 16, "rgba(231,238,247,0.75)", "center");

    for (const b of this.buttons) b.draw(ctx);

    drawText(ctx, "A&D move • W jump • E interact • Q rooms", W / 2, H / 2 + 170, 14, "rgba(231,238,247,0.65)", "center");
  }
}
