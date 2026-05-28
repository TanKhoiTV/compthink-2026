const GAME_SOUND_FILES = {
    deal: "assets/sounds/card-deal.mp3",
    returnDeck: "assets/sounds/card-return-deck.mp3",
    cardSelect: "assets/sounds/card-select.mp3",
    cardPlace: "assets/sounds/card-place.mp3",
    button: "assets/sounds/ui-click.mp3",
    scanCell: "assets/sounds/scan-cell.mp3",
    scanBad: "assets/sounds/scan-bad.mp3",
    eventTraffic: "assets/sounds/event-traffic.mp3",
    eventDistance: "assets/sounds/event-distance.mp3",
    eventStorm: "assets/sounds/event-storm.mp3",
    eventPromo: "assets/sounds/event-promo.mp3",
};
let gameAudioContext = null;
let isGameAudioUnlocked = false;
let lastButtonSoundAt = 0;
let lastCardSelectSoundAt = 0;
let lastDealSoundAt = 0;
let lastReturnSoundAt = 0;
const gameAudioElements = {};
const activeGameFileSounds = {};
const activeGameFileSoundTimers = {};
export function getGameAudioContext() {
    var _a;
    const AudioContextConstructor = (_a = window.AudioContext) !== null && _a !== void 0 ? _a : window.webkitAudioContext;
    if (!AudioContextConstructor)
        return null;
    if (!gameAudioContext) {
        gameAudioContext = new AudioContextConstructor();
    }
    return gameAudioContext;
}
function getGameAudioElement(name) {
    if (!gameAudioElements[name]) {
        const audio = new Audio(GAME_SOUND_FILES[name]);
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        const volumeByName = {
            deal: 0.78,
            returnDeck: 0.68,
            cardSelect: 0.82,
            cardPlace: 0.76,
            button: 0.6,
            scanCell: 0.62,
            scanBad: 0.72,
            eventTraffic: 0.62,
            eventDistance: 0.72,
            eventStorm: 0.7,
            eventPromo: 0.74,
        };
        const playbackRateByName = {
            deal: 1.08,
            returnDeck: 1.0,
            cardSelect: 1.08,
            cardPlace: 0.95,
            button: 1.05,
            scanCell: 1.14,
            scanBad: 0.96,
            eventTraffic: 1.06,
            eventDistance: 1.02,
            eventStorm: 1,
            eventPromo: 1.08,
        };
        audio.volume = volumeByName[name];
        audio.playbackRate = playbackRateByName[name];
        gameAudioElements[name] = audio;
    }
    return gameAudioElements[name];
}
function unlockGameAudio() {
    const audioContext = getGameAudioContext();
    if ((audioContext === null || audioContext === void 0 ? void 0 : audioContext.state) === "suspended") {
        audioContext.resume();
    }
    getGameAudioElement("deal").load();
    getGameAudioElement("returnDeck").load();
    getGameAudioElement("cardSelect").load();
    getGameAudioElement("cardPlace").load();
    getGameAudioElement("button").load();
    getGameAudioElement("scanCell").load();
    getGameAudioElement("scanBad").load();
    getGameAudioElement("eventTraffic").load();
    getGameAudioElement("eventDistance").load();
    getGameAudioElement("eventStorm").load();
    getGameAudioElement("eventPromo").load();
    isGameAudioUnlocked = true;
}
function playFileSound(name, options) {
    var _a, _b, _c, _d;
    if (!isGameAudioUnlocked)
        return;
    if (options === null || options === void 0 ? void 0 : options.exclusive) {
        (_a = activeGameFileSounds[name]) === null || _a === void 0 ? void 0 : _a.pause();
        activeGameFileSounds[name] = undefined;
        if (activeGameFileSoundTimers[name] !== undefined) {
            window.clearTimeout(activeGameFileSoundTimers[name]);
            activeGameFileSoundTimers[name] = undefined;
        }
    }
    const baseAudio = getGameAudioElement(name);
    const audio = baseAudio.cloneNode(true);
    audio.volume = (_b = options === null || options === void 0 ? void 0 : options.volume) !== null && _b !== void 0 ? _b : baseAudio.volume;
    audio.playbackRate = (_c = options === null || options === void 0 ? void 0 : options.playbackRate) !== null && _c !== void 0 ? _c : baseAudio.playbackRate;
    audio.currentTime = (_d = options === null || options === void 0 ? void 0 : options.startTime) !== null && _d !== void 0 ? _d : 0;
    if (options === null || options === void 0 ? void 0 : options.exclusive) {
        activeGameFileSounds[name] = audio;
    }
    audio.play().catch(() => { });
    if ((options === null || options === void 0 ? void 0 : options.durationMs) !== undefined) {
        activeGameFileSoundTimers[name] = window.setTimeout(() => {
            audio.pause();
            activeGameFileSounds[name] = undefined;
            activeGameFileSoundTimers[name] = undefined;
        }, options.durationMs);
    }
}
function createGameGain(audioContext, volume) {
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(Math.max(0.0001, volume), audioContext.currentTime);
    gain.connect(audioContext.destination);
    return gain;
}
function createCardPaperBuffer(audioContext, duration, roughness = 1) {
    const sampleRate = audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    let crackleHold = 0;
    for (let index = 0; index < frameCount; index += 1) {
        const progress = index / frameCount;
        const attack = Math.min(1, progress / 0.045);
        const release = Math.pow(1 - progress, 2.05);
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.035 * white) / 1.035;
        if (Math.random() > 0.985) {
            crackleHold = (Math.random() * 2 - 1) * 0.65 * roughness;
        }
        else {
            crackleHold *= 0.82;
        }
        data[index] =
            (white * 0.55 + brown * 5.8 + crackleHold * 0.42) * attack * release;
    }
    return buffer;
}
export function playFilteredPaperSound(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const audioContext = getGameAudioContext();
    if (!audioContext || !isGameAudioUnlocked)
        return;
    const duration = (_a = options.duration) !== null && _a !== void 0 ? _a : 0.11;
    const startDelay = (_b = options.startDelay) !== null && _b !== void 0 ? _b : 0;
    const volume = (_c = options.volume) !== null && _c !== void 0 ? _c : 0.06;
    const startTime = audioContext.currentTime + startDelay;
    const source = audioContext.createBufferSource();
    const highpass = audioContext.createBiquadFilter();
    const lowpass = audioContext.createBiquadFilter();
    const bandpass = audioContext.createBiquadFilter();
    const gain = createGameGain(audioContext, volume);
    const panner = (_d = audioContext.createStereoPanner) === null || _d === void 0 ? void 0 : _d.call(audioContext);
    source.buffer = createCardPaperBuffer(audioContext, duration, (_e = options.roughness) !== null && _e !== void 0 ? _e : 1);
    source.playbackRate.setValueAtTime((_f = options.playbackRate) !== null && _f !== void 0 ? _f : 1, startTime);
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime((_g = options.highpass) !== null && _g !== void 0 ? _g : 240, startTime);
    highpass.Q.setValueAtTime(0.55, startTime);
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime((_h = options.bandpass) !== null && _h !== void 0 ? _h : 1800, startTime);
    bandpass.Q.setValueAtTime(0.85, startTime);
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime((_j = options.lowpass) !== null && _j !== void 0 ? _j : 4200, startTime);
    lowpass.Q.setValueAtTime(0.6, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(lowpass);
    if (panner) {
        panner.pan.setValueAtTime((_k = options.pan) !== null && _k !== void 0 ? _k : 0, startTime);
        lowpass.connect(panner);
        panner.connect(gain);
    }
    else {
        lowpass.connect(gain);
    }
    source.start(startTime);
    source.stop(startTime + duration + 0.02);
}
export function playCardThump(startDelay = 0, volume = 0.05) {
    playFilteredPaperSound({
        duration: 0.045,
        volume,
        startDelay,
        highpass: 55,
        bandpass: 260,
        lowpass: 900,
        playbackRate: 0.72,
        roughness: 0.55,
    });
}
export function playCardFlick(startDelay = 0, volume = 0.07, pan = 0) {
    playFilteredPaperSound({
        duration: 0.082 + Math.random() * 0.026,
        volume,
        startDelay,
        highpass: 320,
        bandpass: 2100 + Math.random() * 650,
        lowpass: 5400,
        playbackRate: 0.9 + Math.random() * 0.25,
        pan,
        roughness: 1.25,
    });
}
export function playGameSound(name) {
    const now = performance.now();
    if (name === "button") {
        if (now - lastButtonSoundAt < 35)
            return;
        lastButtonSoundAt = now;
        playFileSound("button", {
            volume: 0.72,
            playbackRate: 1.06,
            startTime: 0,
            durationMs: 260,
            exclusive: true,
        });
        return;
    }
    if (name === "cardSelect") {
        if (now - lastCardSelectSoundAt < 80)
            return;
        lastCardSelectSoundAt = now;
        playFileSound("cardSelect", {
            volume: 0.84,
            playbackRate: 1.06,
            startTime: 0.02,
        });
        return;
    }
    if (name === "cardPlace") {
        playFileSound("cardPlace", {
            volume: 0.86,
            playbackRate: 0.98,
            startTime: 0.01,
            durationMs: 420,
            exclusive: true,
        });
        return;
    }
    if (name === "deal") {
        if (now - lastDealSoundAt < 430)
            return;
        lastDealSoundAt = now;
        playFileSound("deal", {
            volume: 0.82,
            playbackRate: 1.12,
            startTime: 0.08,
        });
        return;
    }
    if (name === "returnDeck") {
        if (now - lastReturnSoundAt < 850)
            return;
        lastReturnSoundAt = now;
        playFileSound("returnDeck", {
            volume: 0.72,
            playbackRate: 1.02,
            startTime: 0.02,
            durationMs: 520,
            exclusive: true,
        });
        return;
    }
    if (name === "scanCell") {
        playFileSound("scanCell", {
            volume: 0.62,
            playbackRate: 1.14,
            startTime: 0,
            durationMs: 260,
            exclusive: true,
        });
        return;
    }
    if (name === "scanBad") {
        playFileSound("scanBad", {
            volume: 0.76,
            playbackRate: 0.96,
            startTime: 0,
            durationMs: 420,
            exclusive: true,
        });
        return;
    }
    if (name === "eventTraffic") {
        playFileSound("eventTraffic", {
            volume: 0.62,
            playbackRate: 1.06,
            startTime: 0,
            durationMs: 980,
            exclusive: true,
        });
        return;
    }
    if (name === "eventDistance") {
        playFileSound("eventDistance", {
            volume: 0.72,
            playbackRate: 1.02,
            startTime: 0,
            durationMs: 650,
            exclusive: true,
        });
        return;
    }
    if (name === "eventStorm") {
        playFileSound("eventStorm", {
            volume: 0.7,
            playbackRate: 1,
            startTime: 0,
            durationMs: 1120,
            exclusive: true,
        });
        return;
    }
    if (name === "eventPromo") {
        playFileSound("eventPromo", {
            volume: 0.74,
            playbackRate: 1.08,
            startTime: 0,
            durationMs: 820,
            exclusive: true,
        });
        return;
    }
    if (name === "reject") {
        playFilteredPaperSound({
            duration: 0.06,
            volume: 0.055,
            highpass: 90,
            bandpass: 420,
            lowpass: 1100,
            playbackRate: 0.7,
            roughness: 0.8,
        });
        playCardThump(0.05, 0.045);
    }
}
export function setupGameAudioDelegation() {
    document.addEventListener("pointerdown", (event) => {
        unlockGameAudio();
        const target = event.target;
        if (!target)
            return;
        const isHandOrDraftCard = Boolean(target.closest("[data-hand-card-id], [data-draft-card-id], .hand-card, .daily-draft-card"));
        const boardMiniCard = target.closest(".board-mini");
        if (isHandOrDraftCard) {
            return;
        }
        if (boardMiniCard) {
            playGameSound("cardSelect");
            return;
        }
        playGameSound("button");
    }, true);
}
