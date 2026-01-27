// src/scenes/rooms_overlay.js
import { drawPanel, drawText, roundRect } from "../utils.js";
import { Button } from "../ui.js";
import { ROOM_SIZE } from "../levels.js";
import { Theme } from "../assets.js";

export class RoomsOverlayScene {
  constructor(gameplay) {
    this.gameplay = gameplay;

    this.blocksUpdate = true;
    this.blocksDraw = true;

    this.selected = gameplay.currentRoomIndex;
  }

  onEnter() {
    const { width: W, height: H } = this.engine;
    const panelW = 900, panelH = 520;
    this.px = W / 2 - panelW / 2;
    this.py = H / 2 - panelH / 2;
    this.pw = panelW;
    this.ph = panelH;

    this.btnClose = new Button({
      x: this.px + this.pw - 64, y: this.py + 18, w: 46, h: 38,
      label: "X",
      onClick: () => this._close(),
    });

    this.btnLeft = new Button({
      x: this.px + 500, y: this.py + 290, w: 56, h: 56,
      label: "⟲",
      onClick: () => this._rotateSelected(-1)
    });
    this.btnRight = new Button({
      x: this.px + 820, y: this.py + 290, w: 56, h: 56,
      label: "⟳",
      onClick: () => this._rotateSelected(1)
    });
  }

  _close() {
    this.engine.input.consumeAll();
    this.gameplay.onRoomsOverlayClosed?.();
    this.engine.pop();
  }

  _allowedRoomIndices() {
    const maxVisited = this.gameplay.maxVisitedRoom;
    const nextFuture = Math.min(this.gameplay.world.rooms.length - 1, maxVisited + 1);
    const allowed = [];
    for (let i = 0; i <= maxVisited; i++) allowed.push(i);
    if (!allowed.includes(nextFuture)) allowed.push(nextFuture);
    return allowed;
  }

  _rotateSelected(dir) {
    this.gameplay.applyRoomRotation(this.selected, dir);
  }

  update(dt) {
    const input = this.engine.input;

    if (input.pressed("Escape")) {
      input.consume("Escape");
      this._close();
      return;
    }

    if (input.pressed("e")) { input.consume("e"); this._rotateSelected(-1); }
    if (input.pressed("r")) { input.consume("r"); this._rotateSelected(1); }

    this.btnClose.update(input);
    this.btnLeft.update(input);
    this.btnRight.update(input);

    if (input.mouse.pressed) {
      const allowed = this._allowedRoomIndices();
      const listX = this.px + 30;
      const listY = this.py + 90;
      const itemH = 44;

      for (let i = 0; i < allowed.length; i++) {
        const idx = allowed[i];
        const rx = listX;
        const ry = listY + i * (itemH + 8);
        const rw = 360;
        const rh = itemH;

        if (input.mouse.x >= rx && input.mouse.x <= rx + rw && input.mouse.y >= ry && input.mouse.y <= ry + rh) {
          this.selected = idx;
        }
      }
    }
  }

  draw(ctx) {
    const { width: W, height: H } = this.engine;

    ctx.save();
    ctx.fillStyle = "#070a0f";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    drawPanel(ctx, this.px, this.py, this.pw, this.ph, 0.92);
    drawText(ctx, "Rooms", this.px + 28, this.py + 20, 30);
    drawText(ctx, "Select a past room (or the next future room), rotate with E/R or ⟲/⟳.", this.px + 28, this.py + 56, 14, "rgba(231,238,247,0.70)");
    this.btnClose.draw(ctx);

    const allowed = this._allowedRoomIndices();
    const listX = this.px + 30;
    const listY = this.py + 90;
    const itemW = 360;
    const itemH = 44;

    for (let i = 0; i < allowed.length; i++) {
      const idx = allowed[i];
      const y = listY + i * (itemH + 8);
      const isSel = idx === this.selected;

      ctx.save();
      ctx.fillStyle = isSel ? "rgba(120,166,255,0.18)" : "rgba(255,255,255,0.06)";
      roundRect(ctx, listX, y, itemW, itemH, 12);
      ctx.fill();
      ctx.strokeStyle = isSel ? "rgba(120,166,255,0.55)" : "rgba(255,255,255,0.08)";
      ctx.stroke();
      ctx.restore();

      const tag = idx <= this.gameplay.maxVisitedRoom ? "PAST" : "FUTURE";
      drawText(ctx, `Room ${idx + 1}`, listX + 16, y + 12, 16, "rgba(231,238,247,0.92)");
      drawText(ctx, tag, listX + itemW - 16, y + 12, 12,
        idx <= this.gameplay.maxVisitedRoom ? "rgba(231,238,247,0.55)" : "rgba(123,241,168,0.75)", "right");
    }

    const prevX = this.px + 430;
    const prevY = this.py + 92;
    const prevW = 440;
    const prevH = 392;

    drawPanel(ctx, prevX, prevY, prevW, prevH, 0.50);
    drawText(ctx, `Preview: Room ${this.selected + 1}`, prevX + 16, prevY + 14, 18);

    this._drawRoomPreview(ctx, this.gameplay.world.rooms[this.selected], prevX + 18, prevY + 52, prevW - 36, prevH - 98);

    this.btnLeft.draw(ctx);
    this.btnRight.draw(ctx);

    drawText(ctx, "E: rotate left   R: rotate right   Esc/X: close", prevX + 16, prevY + prevH - 28, 14, "rgba(231,238,247,0.65)");
  }

  _drawRoomPreview(ctx, room, x, y, w, h) {
    const N = ROOM_SIZE;
    const pad = 8;
    const cell = Math.floor(Math.min((w - 2 * pad) / N, (h - 2 * pad) / N));
    const gw = cell * N;
    const gh = cell * N;
    const ox = x + (w - gw) / 2;
    const oy = y + (h - gh) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(15,22,33,0.9)";
    ctx.fillRect(ox - 6, oy - 6, gw + 12, gh + 12);
    ctx.restore();

    for (let ty = 0; ty < N; ty++) {
      for (let tx = 0; tx < N; tx++) {
        const ch = room.tileKind(tx, ty);
        if (ch === ".") continue;

        if (ch === "#") {
          ctx.fillStyle = ((tx + ty) & 1) ? Theme.tile.solid : Theme.tile.solidAlt;
          ctx.fillRect(ox + tx * cell, oy + ty * cell, cell, cell);
        } else if (ch === "B") {
          ctx.fillStyle = "#f472b6";
          ctx.fillRect(ox + tx * cell, oy + ty * cell, cell, cell);
        } else if (ch === "G") {
          ctx.fillStyle = room.gatesOpen ? "rgba(123,241,168,0.22)" : "rgba(255,255,255,0.18)";
          ctx.fillRect(ox + tx * cell, oy + ty * cell, cell, cell);
        }
      }
    }

    ctx.fillStyle = Theme.coin;
    for (const c of room.coins) {
      if (c.taken) continue;
      const cx = ox + (c.tx + 0.5) * cell;
      const cy = oy + (c.ty + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, cell * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }

    if (room.door) {
      ctx.fillStyle = Theme.door;
      ctx.fillRect(
        ox + room.door.tx * cell + cell * 0.18,
        oy + room.door.ty * cell - cell * 0.9,
        cell * 0.64,
        cell * 1.9
      );
    }
  }
}
