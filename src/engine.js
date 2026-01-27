// src/engine.js
export class Input {
  constructor(canvas) {
    this._down = new Set();
    this._pressed = new Set();
    this._released = new Set();

    this.mouse = { x: 0, y: 0, down: false, pressed: false, released: false };

    window.addEventListener("keydown", (e) => {
      const k = normalizeKey(e.key);
      if (!this._down.has(k)) this._pressed.add(k);
      this._down.add(k);

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("keyup", (e) => {
      const k = normalizeKey(e.key);
      this._down.delete(k);
      this._released.add(k);
    });

    const toCanvas = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * sx,
        y: (evt.clientY - rect.top) * sy,
      };
    };

    canvas.addEventListener("mousemove", (e) => {
      const p = toCanvas(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (!this.mouse.down) this.mouse.pressed = true;
      this.mouse.down = true;
      const p = toCanvas(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button !== 0) return;
      this.mouse.down = false;
      this.mouse.released = true;
    });
  }

  down(k) { return this._down.has(normalizeKey(k)); }
  pressed(k) { return this._pressed.has(normalizeKey(k)); }
  released(k) { return this._released.has(normalizeKey(k)); }

  consume(k) {
    k = normalizeKey(k);
    this._pressed.delete(k);
    this._released.delete(k);
  }

  consumeAll() {
    this._pressed.clear();
    this._released.clear();
    this.mouse.pressed = false;
    this.mouse.released = false;
  }

  _beginFrame() {
  }

  _endFrame() {
    this._pressed.clear();
    this._released.clear();
    this.mouse.pressed = false;
    this.mouse.released = false;
  }
}

function normalizeKey(k) {
  if (k === " ") return "Space";
  return k.length === 1 ? k.toLowerCase() : k;
}

export class Engine {
  constructor(canvas, width = canvas.width, height = canvas.height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.width = width;
    this.height = height;

    this.scenes = [];
    this.input = new Input(canvas);

    this._last = performance.now();
  }

  push(scene) {
    scene.engine = this;
    this.scenes.push(scene);
    scene.onEnter?.(this);
    this.input.consumeAll();
  }

  pop() {
    const s = this.scenes.pop();
    s?.onExit?.();
    this.input.consumeAll();
    return s;
  }

  replace(scene) {
    while (this.scenes.length) {
      const s = this.scenes.pop();
      s?.onExit?.();
    }
    this.push(scene);
  }

  top() {
    return this.scenes[this.scenes.length - 1];
  }

  run() {
    const loop = (now) => {
      const dt = Math.min(1 / 20, (now - this._last) / 1000);
      this._last = now;

      this.input._beginFrame();

      for (let i = this.scenes.length - 1; i >= 0; i--) {
        const s = this.scenes[i];
        s.update?.(dt);
        if (s.blocksUpdate) break;
      }

      this.ctx.clearRect(0, 0, this.width, this.height);
      for (let i = 0; i < this.scenes.length; i++) {
        const s = this.scenes[i];
        s.draw?.(this.ctx);
        if (s.blocksDraw) break;
      }

      this.input._endFrame();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
