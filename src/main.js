// src/main.js
import { Engine } from "./engine.js";
import { MenuScene } from "./scenes/menu.js";
import { AudioManager } from "./audio.js";


const canvas = document.getElementById("game");
const engine = new Engine(canvas);

const unlockAudio = () => {
    AudioManager.unlockFromUserGesture();
};

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("mousedown", unlockAudio, { once: true });
window.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
window.addEventListener("keydown", unlockAudio, { once: true });


engine.push(new MenuScene());
engine.run();
