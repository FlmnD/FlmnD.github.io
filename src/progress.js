// src/progress.js

const KEY = "superspin_progress_v1";

function _safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
}

export function loadProgress() {
    const base = {
        unlockedUpTo: 1, 
        best: {
        }
    };

    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return base;
        const data = _safeParse(raw, base);

        if (typeof data.unlockedUpTo !== "number") data.unlockedUpTo = 1;
        if (!data.best || typeof data.best !== "object") data.best = {};
        data.unlockedUpTo = Math.max(1, Math.floor(data.unlockedUpTo));
        return data;
    } catch {
        return base;
    }
}

export function saveProgress(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { }
}

export function isUnlocked(levelId) {
    const p = loadProgress();
    return levelId <= p.unlockedUpTo;
}

export function getBest(levelId) {
    const p = loadProgress();
    return p.best?.[String(levelId)] ?? null;
}

export function markCompleted(levelId, timeMs, tries) {
    const p = loadProgress();

    p.unlockedUpTo = Math.max(p.unlockedUpTo, levelId + 1);

    const k = String(levelId);
    const prev = p.best[k];
    const cleanTime = Math.max(0, Math.floor(timeMs));
    const cleanTries = Math.max(0, Math.floor(tries));

    if (!prev || cleanTime < prev.timeMs) {
        p.best[k] = { timeMs: cleanTime, tries: cleanTries };
    }

    saveProgress(p);
    return p;
}

export function formatTimeMs(ms) {
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const centis = Math.floor((total % 1000) / 10);

    const mm = String(minutes);
    const ss = String(seconds).padStart(2, "0");
    const cc = String(centis).padStart(2, "0");
    return `${mm}:${ss}.${cc}`;
}
