// src/scenes/celebration.js
import { drawPanel, drawText } from "../utils.js";
import { Button } from "../ui.js";
import { LEVELS } from "../levels.js";
import { markCompleted, getBest, formatTimeMs } from "../progress.js";
import { LevelSelectScene } from "./level_select.js";
import { GameplayScene } from "./play.js";

export class CelebrationScene {
    constructor({ levelId, runTimeMs, runTries }) {
        this.blocksUpdate = true;
        this.blocksDraw = false;

        this.levelId = levelId;
        this.runTimeMs = runTimeMs;
        this.runTries = runTries;

        markCompleted(levelId, runTimeMs, runTries);

        this.buttons = [];
    }

    onEnter() {
        const W = this.engine.width;
        const H = this.engine.height;

        const bw = 320, bh = 54;
        const cx = W / 2 - bw / 2;
        const y0 = H / 2 + 40;

        const nextExists = LEVELS.some(l => l.id === this.levelId + 1);

        this.btnContinue = new Button({
            x: cx, y: y0, w: bw, h: bh,
            label: nextExists ? "Continue" : "Back to Level Select",
            onClick: () => {
                if (nextExists) this.engine.replace(new GameplayScene(this.levelId + 1));
                else this.engine.replace(new LevelSelectScene());
            }
        });

        this.btnReplay = new Button({
            x: cx, y: y0 + 70, w: bw, h: bh,
            label: "Replay Level",
            onClick: () => this.engine.replace(new GameplayScene(this.levelId))
        });

        this.btnBack = new Button({
            x: cx, y: y0 + 140, w: bw, h: bh,
            label: "Back to Level Select (Esc)",
            onClick: () => this.engine.replace(new LevelSelectScene()),
            hotkey: "Escape"
        });

        this.buttons = [this.btnContinue, this.btnReplay, this.btnBack];
    }

    update(dt) {
        const input = this.engine.input;
        for (const b of this.buttons) b.update(input);
        if (input.pressed("Escape")) this.engine.replace(new LevelSelectScene());
    }

    draw(ctx) {
        const W = this.engine.width;
        const H = this.engine.height;

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        drawPanel(ctx, W / 2 - 420, H / 2 - 260, 840, 540, 0.80);

        drawText(ctx, "Level Complete!", W / 2, H / 2 - 210, 44, "rgba(231,238,247,0.95)", "center");

        drawText(ctx, `Time: ${formatTimeMs(this.runTimeMs)}`, W / 2, H / 2 - 150, 22, "rgba(231,238,247,0.90)", "center");
        drawText(ctx, `Tries: ${this.runTries}`, W / 2, H / 2 - 118, 18, "rgba(231,238,247,0.75)", "center");

        const best = getBest(this.levelId);
        if (best) {
            drawText(ctx, `Best Time: ${formatTimeMs(best.timeMs)}`, W / 2, H / 2 - 78, 18, "rgba(123,241,168,0.85)", "center");
        }

        for (const b of this.buttons) b.draw(ctx);
    }
}
