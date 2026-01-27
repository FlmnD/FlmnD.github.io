// src/scenes/cutscene.js
import { clamp, drawPanel, drawText } from "../utils.js";

export class CutsceneScene {
    constructor(panels, {
        holdToSkipSeconds = 2.0,
        onFinish = null
    } = {}) {
        this.blocksUpdate = true;
        this.blocksDraw = false;

        this.panels = Array.isArray(panels) ? panels : [String(panels ?? "")];
        this.i = 0;

        this.holdToSkipSeconds = holdToSkipSeconds;
        this.skipHold = 0;

        this.onFinish = onFinish;
    }

    update(dt) {
        const input = this.engine.input;

        if (input.mouse.pressed) {
            this._advanceOrFinish();
            return;
        }

        if (input.down("e")) {
            this.skipHold = clamp(this.skipHold + dt, 0, this.holdToSkipSeconds);
            if (this.skipHold >= this.holdToSkipSeconds) {
                this._finish(true);
            }
        } else {
            this.skipHold = 0;
        }
    }

    _advanceOrFinish() {
        this.i++;
        if (this.i >= this.panels.length) this._finish(false);
    }

    _finish(skipped) {
        this.engine.pop();
        this.onFinish?.({ skipped });
    }

    draw(ctx) {
        const W = this.engine.width;
        const H = this.engine.height;

        ctx.save();
        ctx.fillStyle = "rgba(10,14,20,1)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        const pad = 48;
        drawPanel(ctx, pad, pad, W - pad * 2, H - pad * 2, 0.78);

        const text = this.panels[this.i] ?? "";
        this._drawWrapped(ctx, text, pad + 36, pad + 44, W - pad * 2 - 72, H - pad * 2 - 140, 22);

        const rightPad = 28;
        const y = H - 40;

        const barW = 160, barH = 8;
        const barX = W - rightPad - barW;
        const barY = y - 18;

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "rgba(120,166,255,0.75)";
        ctx.fillRect(barX, barY, barW * (this.skipHold / this.holdToSkipSeconds), barH);
        ctx.restore();

        drawText(ctx, "Hold E (2s) to skip", W - rightPad, y, 14, "rgba(231,238,247,0.70)", "right");

        drawText(ctx, "Click to continue", W - rightPad - 220, y, 14, "rgba(231,238,247,0.55)", "right");

        drawText(ctx, `${this.i + 1}/${this.panels.length}`, W / 2, H - 42, 14, "rgba(231,238,247,0.55)", "center");
    }

    _drawWrapped(ctx, text, x, y, w, h, size) {
        const lines = wrapText(ctx, text, w, size);
        const lineH = Math.floor(size * 1.4);

        let yy = y;
        for (const ln of lines) {
            if (yy > y + h - lineH) break;
            drawText(ctx, ln, x, yy, size, "rgba(231,238,247,0.92)", "left");
            yy += lineH;
        }
    }
}

function wrapText(ctx, text, maxWidth, size) {
    ctx.save();
    ctx.font = `${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;

    const paras = String(text).split("\n");
    const out = [];

    for (const para of paras) {
        const words = para.split(" ");
        let line = "";

        for (const word of words) {
            const test = line ? (line + " " + word) : word;
            const m = ctx.measureText(test).width;
            if (m <= maxWidth) {
                line = test;
            } else {
                if (line) out.push(line);
                line = word;
            }
        }
        if (line) out.push(line);
        out.push("");
    }

    ctx.restore();
    while (out.length && out[out.length - 1] === "") out.pop();
    return out;
}
