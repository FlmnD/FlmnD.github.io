// src/audio.js
export const AudioManager = (() => {
    let unlocked = false;

    const tracks = {
        menu: new Audio("./assets/audio/menu.mp3"),
        game: new Audio("./assets/audio/game.mp3"),
    };

    const STORAGE_KEY = "rr_music_volume";
    let volume = 1.0;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const v = parseFloat(raw);
            if (Number.isFinite(v)) volume = Math.max(0, Math.min(1, v));
        }
    } catch { }

    for (const t of Object.values(tracks)) {
        t.loop = true;
        t.preload = "auto";
        t.playsInline = true;
        t.volume = volume;
    }

    const SFX_KEY = "rr_sfx_volume";
    let sfxVolume = 1.0;

    try {
        const raw = localStorage.getItem(SFX_KEY);
        if (raw !== null) {
            const v = parseFloat(raw);
            if (Number.isFinite(v)) sfxVolume = Math.max(0, Math.min(1, v));
        }
    } catch { }

    const sfxPool = [];
    const SFX_POOL_SIZE = 8;

    function _getSfxAudio(url) {
        for (const a of sfxPool) {
            if (a.paused || a.ended) return a;
        }
        if (sfxPool.length < SFX_POOL_SIZE) {
            const a = new Audio(url);
            a.preload = "auto";
            a.playsInline = true;
            sfxPool.push(a);
            return a;
        }
        return sfxPool[0];
    }

    function playSfx(name, volumeMul = 1.0) {
        if (!unlocked) return;

        const url = `./assets/audio/${name}.mp3`;
        const a = _getSfxAudio(url);

        if (a.src !== new URL(url, window.location.href).href) {
            a.src = url;
        }

        try {
            a.pause();
            a.currentTime = 0;
        } catch { }

        a.volume = Math.max(0, Math.min(1, sfxVolume * volumeMul));

        a.play().catch(() => { });
    }

    function setSfxVolume(v) {
        sfxVolume = Math.max(0, Math.min(1, v));
        try { localStorage.setItem(SFX_KEY, String(sfxVolume)); } catch { }
    }

    function getSfxVolume() {
        return sfxVolume;
    }

    let desired = "menu";
    let current = null;

    function setDesired(name) {
        if (!tracks[name]) return;
        desired = name;
        if (unlocked) _switchToDesired();
    }

    async function unlockFromUserGesture() {
        if (unlocked) return;
        unlocked = true;
        await _switchToDesired();

        for (let i = 0; i < 2; i++) {
            if (sfxPool.length < SFX_POOL_SIZE) {
                const a = new Audio();
                a.preload = "auto";
                a.playsInline = true;
                sfxPool.push(a);
            }
        }
    }

    async function _switchToDesired() {
        const next = desired;
        if (!tracks[next]) return;

        if (current === next && !tracks[next].paused) return;

        if (current && current !== next) {
            try {
                tracks[current].pause();
                tracks[current].currentTime = 0;
            } catch { }
        }

        current = next;

        try {
            await tracks[next].play();
        } catch {
        }
    }

    function stopAll() {
        for (const t of Object.values(tracks)) {
            try {
                t.pause();
                t.currentTime = 0;
            } catch { }
        }
        for (const a of sfxPool) {
            try {
                a.pause();
                a.currentTime = 0;
            } catch { }
        }
        current = null;
    }

    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        for (const t of Object.values(tracks)) t.volume = volume;
        try { localStorage.setItem(STORAGE_KEY, String(volume)); } catch { }
    }

    function getVolume() {
        return volume;
    }

    document.addEventListener("visibilitychange", () => {
        if (!unlocked) return;
        if (!document.hidden) _switchToDesired();
    });

    return {
        setDesired,
        unlockFromUserGesture,
        stopAll,
        setVolume,
        getVolume,

        playSfx,
        setSfxVolume,
        getSfxVolume,
    };
})();
