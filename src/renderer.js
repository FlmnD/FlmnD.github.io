// src/renderer.js
import { Theme } from "./assets.js";
import { ROOM_SIZE, TILE_SIZE, ROOM_PIXEL } from "./levels.js";

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  drawWorld(ctx, world, camera) {
    ctx.fillStyle = Theme.bg;
    ctx.fillRect(0, 0, camera.w, camera.h);

    for (const room of world.rooms) {
      const sx = Math.floor(room.worldX - camera.x);
      const sy = Math.floor(room.worldY - camera.y);

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.fillRect(sx, sy, ROOM_PIXEL, ROOM_PIXEL);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, ROOM_PIXEL - 1, ROOM_PIXEL - 1);

      for (const w of room.wind) {
        const x = sx + w.tx * TILE_SIZE;
        const y = sy + w.ty * TILE_SIZE;
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#78a6ff";
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#dbeafe";
        ctx.font = "14px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(w.dir, x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 1);
        ctx.restore();
      }

      for (const p of room.plates) {
        const x = sx + p.tx * TILE_SIZE;
        const y = sy + p.ty * TILE_SIZE;
        ctx.save();
        ctx.fillStyle = p.pressed ? Theme.ui.ok : "rgba(255,255,255,0.12)";
        roundRect(ctx, x + 4, y + 10, TILE_SIZE - 8, TILE_SIZE - 12, 6);
        ctx.fill();
        ctx.restore();
      }

      for (const c of room.coins) {
        if (c.taken) continue;
        const cx = sx + c.tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = sy + c.ty * TILE_SIZE + TILE_SIZE / 2;
        ctx.save();
        ctx.fillStyle = Theme.coin;
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();
        ctx.restore();
      }

      if (room.door) {
        const x = sx + room.door.tx * TILE_SIZE;
        const y = sy + room.door.ty * TILE_SIZE;
        ctx.save();
        ctx.fillStyle = Theme.door;
        roundRect(ctx, x + 4, y + 2, TILE_SIZE - 8, TILE_SIZE - 4, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();
        ctx.restore();
      }

      const angle = room.getVisualAngle();
      ctx.save();
      ctx.translate(sx + ROOM_PIXEL / 2, sy + ROOM_PIXEL / 2);
      ctx.rotate(angle);
      ctx.translate(-ROOM_PIXEL / 2, -ROOM_PIXEL / 2);

      for (let ty = 0; ty < ROOM_SIZE; ty++) {
        for (let tx = 0; tx < ROOM_SIZE; tx++) {
          const ch = room.tileKind(tx, ty);
          if (ch === ".") continue;

          const x = tx * TILE_SIZE;
          const y = ty * TILE_SIZE;

          if (ch === "#") {
            ctx.fillStyle = (tx + ty) % 2 ? Theme.tile.solid : Theme.tile.solidAlt;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = Theme.tile.outline;
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          } else if (ch === "B") {
            ctx.fillStyle = "#f472b6";
            roundRect(ctx, x + 3, y + 6, TILE_SIZE - 6, TILE_SIZE - 10, 8);
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.35)";
            ctx.stroke();
          } else if (ch === "G") {
            ctx.fillStyle = room.gatesOpen ? "rgba(123,241,168,0.18)" : "rgba(255,255,255,0.16)";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "rgba(0,0,0,0.35)";
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          }
        }
      }

      for (const p of world.platforms) {
        if (p.roomIndex !== room.index) continue;
        const lx = p.x - room.worldX;
        const ly = p.y - room.worldY;
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        roundRect(ctx, lx, ly, p.w, p.h, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  drawPlayer(ctx, player, camera) {
    const x = Math.floor(player.x - camera.x);
    const y = Math.floor(player.y - camera.y);

    ctx.save();
    ctx.fillStyle = Theme.player.body;
    roundRect(ctx, x, y, player.w, player.h, 8);
    ctx.fill();
    ctx.strokeStyle = Theme.player.outline;
    ctx.stroke();
    ctx.restore();
  }
}
