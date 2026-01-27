// src/scenes/level_select.js

import { Button } from "../ui.js";
import { drawText, drawPanel, roundRect } from "../utils.js";
import { LEVELS } from "../levels.js";
import { GameplayScene } from "./play.js";
import { MenuScene } from "./menu.js";
import { AudioManager } from "../audio.js";
import { isUnlocked, getBest, formatTimeMs, loadProgress, saveProgress } from "../progress.js";

export class LevelSelectScene {
  constructor() {
    this.buttons = [];
    this.lockedInfo = []; 
    this._hoverTip = null;

    this.confirm = null; 
    this.confirmYes = null;
    this.confirmNo = null;
  }

  onEnter() {
    const { width: W, height: H } = this.engine;

    AudioManager.setDesired("menu");

    const bw = 560, bh = 64;
    const x = W / 2 - bw / 2;
    const y0 = H / 2 - 140;

    this.lockedInfo = [];
    this.confirm = null;
    this.confirmYes = null;
    this.confirmNo = null;

    this.buttons = LEVELS.map((lvl, i) => {
      const unlocked = (lvl.id === 1) || isUnlocked(lvl.id);
      const label = unlocked ? lvl.name : `🔒 ${lvl.name}`;

      const btn = new Button({
        x,
        y: y0 + i * 86,
        w: bw,
        h: bh,
        label,
        onClick: () => {
          if (unlocked) {
            this.engine.replace(new GameplayScene(lvl.id));
            return;
          }

          this._openConfirm(lvl.id, lvl.name);
        }
      });

      btn.disabled = false;

      if (!unlocked) {
        const req = lvl.id - 1;
        const tip = `Beat Level ${req} to unlock. (Or click to override.)`;
        this.lockedInfo.push({
          rect: { x: btn.x, y: btn.y, w: btn.w, h: btn.h },
          tip,
          levelId: lvl.id
        });
      }

      return btn;
    });

    this.back = new Button({
      x: W / 2 - 140,
      y: H / 2 + 180,
      w: 280,
      h: 52,
      label: "Back (Esc)",
      onClick: () => this.engine.replace(new MenuScene()),
      hotkey: "Escape"
    });
  }

  _openConfirm(levelId, levelName) {
    const { width: W, height: H } = this.engine;

    this.confirm = { levelId, levelName };

    const bw = 140, bh = 44;
    const y = H / 2 + 80;

    this.confirmYes = new Button({
      x: W / 2 - bw - 14,
      y,
      w: bw,
      h: bh,
      label: "Yes",
      onClick: () => {
        const p = loadProgress();
        p.unlockedUpTo = Math.max(p.unlockedUpTo, levelId);
        saveProgress(p);

        this.engine.replace(new GameplayScene(levelId));
      }
    });

    this.confirmNo = new Button({
      x: W / 2 + 14,
      y,
      w: bw,
      h: bh,
      label: "No",
      onClick: () => {
        this.confirm = null;
        this.confirmYes = null;
        this.confirmNo = null;
      }
    });
  }

  update(dt) {
    const input = this.engine.input;

    if (this.confirm) {
      if (input.pressed("Escape")) {
        input.consume("Escape");
        this.confirmNo?.onClick?.();
        return;
      }
      this.confirmYes?.update(input);
      this.confirmNo?.update(input);
      return;
    }

    for (const b of this.buttons) b.update(input);
    this.back.update(input);

    if (input.pressed("Escape")) this.engine.replace(new MenuScene());

    this._hoverTip = null;
    const mx = input.mouse.x, my = input.mouse.y;
    for (const li of this.lockedInfo) {
      if (mx >= li.rect.x && mx <= li.rect.x + li.rect.w && my >= li.rect.y && my <= li.rect.y + li.rect.h) {
        this._hoverTip = li.tip;
        break;
      }
    }
  }

  draw(ctx) {
    const { width: W, height: H } = this.engine;

    drawPanel(ctx, W / 2 - 420, H / 2 - 270, 840, 560, 0.60);
    drawText(ctx, "Select a Level", W / 2, H / 2 - 220, 36, "rgba(231,238,247,0.95)", "center");
    drawText(ctx, "Goal: collect all coins, then hold E at the door.", W / 2, H / 2 - 184, 16, "rgba(231,238,247,0.70)", "center");

    for (let i = 0; i < this.buttons.length; i++) {
      const b = this.buttons[i];
      const lvl = LEVELS[i];
      const unlocked = (lvl.id === 1) || isUnlocked(lvl.id);

      b.draw(ctx);

      if (!unlocked) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        roundRect(ctx, b.x, b.y, b.w, b.h, 14);
        ctx.fill();
        ctx.restore();
      } else {
        const best = getBest(lvl.id);
        if (best) {
          drawText(
            ctx,
            `Best: ${formatTimeMs(best.timeMs)}`,
            b.x + b.w - 18,
            b.y + 40,
            14,
            "rgba(123,241,168,0.78)",
            "right"
          );
        }
      }
    }

    this.back.draw(ctx);

    if (this._hoverTip && !this.confirm) {
      const mx = this.engine.input.mouse.x;
      const my = this.engine.input.mouse.y;
      const tw = 300, th = 46;
      const tx = Math.min(W - tw - 16, mx + 12);
      const ty = Math.min(H - th - 16, my + 12);

      drawPanel(ctx, tx, ty, tw, th, 0.85);
      drawText(ctx, this._hoverTip, tx + 14, ty + 14, 14, "rgba(231,238,247,0.92)", "left");
    }

    if (this.confirm) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      const pw = 700, ph = 260;
      const px = W / 2 - pw / 2;
      const py = H / 2 - ph / 2;

      drawPanel(ctx, px, py, pw, ph, 0.95);

      drawText(
        ctx,
        `Play ${this.confirm.levelName}?`,
        W / 2,
        py + 44,
        26,
        "rgba(231,238,247,0.95)",
        "center"
      );

      drawText(
        ctx,
        "Are you sure you want to play this level?",
        W / 2,
        py + 88,
        16,
        "rgba(231,238,247,0.85)",
        "center"
      );

      drawText(
        ctx,
        "Only play locked levels if you cannot beat previous levels.",
        W / 2,
        py + 114,
        15,
        "rgba(231,238,247,0.70)",
        "center"
      );

      drawText(
        ctx,
        "Choosing Yes unlocks this level forever.",
        W / 2,
        py + 146,
        14,
        "rgba(231,238,247,0.65)",
        "center"
      );

      this.confirmYes?.draw(ctx);
      this.confirmNo?.draw(ctx);

    }
  }
}
