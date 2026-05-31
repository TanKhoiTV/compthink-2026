import { RETURN_SOUND_THROTTLE_MS } from "../shared/animations.ts";

export type GameSoundName =
	| "button"
	| "cardSelect"
	| "cardPlace"
	| "deal"
	| "returnDeck"
	| "scanCell"
	| "scanBad"
	| "eventTraffic"
	| "eventDistance"
	| "eventStorm"
	| "eventPromo"
	| "reject";

const GAME_SOUND_FILES = {
	deal: "assets/audio/sounds/card-deal.mp3",
	returnDeck: "assets/audio/sounds/card-return-deck.mp3",
	cardSelect: "assets/audio/sounds/card-select.mp3",
	cardPlace: "assets/audio/sounds/card-place.mp3",
	button: "assets/audio/sounds/ui-click.mp3",
	scanCell: "assets/audio/sounds/scan-cell.mp3",
	scanBad: "assets/audio/sounds/scan-bad.mp3",
	eventTraffic: "assets/audio/sounds/event-traffic.mp3",
	eventDistance: "assets/audio/sounds/event-distance.mp3",
	eventStorm: "assets/audio/sounds/event-storm.mp3",
	eventPromo: "assets/audio/sounds/event-promo.mp3",
} as const;

let gameAudioContext: AudioContext | null = null;
let isGameAudioUnlocked = false;
let lastButtonSoundAt = 0;
let lastCardSelectSoundAt = 0;
let lastDealSoundAt = 0;
let lastReturnSoundAt = 0;

type GameFileSoundName = keyof typeof GAME_SOUND_FILES;

const gameAudioElements: Partial<Record<GameFileSoundName, HTMLAudioElement>> =
	{};
const activeGameFileSounds: Partial<
	Record<GameFileSoundName, HTMLAudioElement>
> = {};
const activeGameFileSoundTimers: Partial<Record<GameFileSoundName, number>> =
	{};

export function getGameAudioContext(): AudioContext | null {
	const AudioContextConstructor =
		window.AudioContext ??
		(window as { webkitAudioContext?: any }).webkitAudioContext;

	if (!AudioContextConstructor) return null;

	if (!gameAudioContext) {
		gameAudioContext = new AudioContextConstructor();
	}

	return gameAudioContext;
}

function getGameAudioElement(name: GameFileSoundName) {
	if (!gameAudioElements[name]) {
		const audio = new Audio(GAME_SOUND_FILES[name]);

		audio.preload = "auto";
		audio.crossOrigin = "anonymous";

		const volumeByName: Record<GameFileSoundName, number> = {
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
		const playbackRateByName: Record<GameFileSoundName, number> = {
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

	return gameAudioElements[name]!;
}

function unlockGameAudio() {
	const audioContext = getGameAudioContext();

	if (audioContext?.state === "suspended") {
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

function playFileSound(
	name: GameFileSoundName,
	options?: {
		volume?: number;
		playbackRate?: number;
		startTime?: number;
		durationMs?: number;
		exclusive?: boolean;
	},
) {
	if (!isGameAudioUnlocked) return;

	if (options?.exclusive) {
		activeGameFileSounds[name]?.pause();
		activeGameFileSounds[name] = undefined;

		if (activeGameFileSoundTimers[name] !== undefined) {
			window.clearTimeout(activeGameFileSoundTimers[name]);
			activeGameFileSoundTimers[name] = undefined;
		}
	}

	const baseAudio = getGameAudioElement(name);
	const audio = baseAudio.cloneNode(true) as HTMLAudioElement;

	audio.volume = options?.volume ?? baseAudio.volume;
	audio.playbackRate = options?.playbackRate ?? baseAudio.playbackRate;
	audio.currentTime = options?.startTime ?? 0;

	if (options?.exclusive) {
		activeGameFileSounds[name] = audio;
	}

	audio.play().catch(() => {});

	if (options?.durationMs !== undefined) {
		activeGameFileSoundTimers[name] = window.setTimeout(() => {
			audio.pause();
			activeGameFileSounds[name] = undefined;
			activeGameFileSoundTimers[name] = undefined;
		}, options.durationMs);
	}
}

function createGameGain(audioContext: AudioContext, volume: number) {
	const gain = audioContext.createGain();

	gain.gain.setValueAtTime(Math.max(0.0001, volume), audioContext.currentTime);
	gain.connect(audioContext.destination);

	return gain;
}

function createCardPaperBuffer(
	audioContext: AudioContext,
	duration: number,
	roughness = 1,
) {
	const sampleRate = audioContext.sampleRate;
	const frameCount = Math.max(1, Math.floor(sampleRate * duration));
	const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
	const data = buffer.getChannelData(0);

	let brown = 0;
	let crackleHold = 0;

	for (let index = 0; index < frameCount; index += 1) {
		const progress = index / frameCount;
		const attack = Math.min(1, progress / 0.045);
		const release = (1 - progress) ** 2.05;
		const white = Math.random() * 2 - 1;

		brown = (brown + 0.035 * white) / 1.035;

		if (Math.random() > 0.985) {
			crackleHold = (Math.random() * 2 - 1) * 0.65 * roughness;
		} else {
			crackleHold *= 0.82;
		}

		data[index] =
			(white * 0.55 + brown * 5.8 + crackleHold * 0.42) * attack * release;
	}

	return buffer;
}

export function playFilteredPaperSound(options: {
	duration?: number;
	volume?: number;
	startDelay?: number;
	highpass?: number;
	lowpass?: number;
	bandpass?: number;
	playbackRate?: number;
	pan?: number;
	roughness?: number;
}) {
	const audioContext = getGameAudioContext();

	if (!audioContext || !isGameAudioUnlocked) return;

	const duration = options.duration ?? 0.11;
	const startDelay = options.startDelay ?? 0;
	const volume = options.volume ?? 0.06;
	const startTime = audioContext.currentTime + startDelay;
	const source = audioContext.createBufferSource();
	const highpass = audioContext.createBiquadFilter();
	const lowpass = audioContext.createBiquadFilter();
	const bandpass = audioContext.createBiquadFilter();
	const gain = createGameGain(audioContext, volume);
	const panner = audioContext.createStereoPanner?.();

	source.buffer = createCardPaperBuffer(
		audioContext,
		duration,
		options.roughness ?? 1,
	);
	source.playbackRate.setValueAtTime(options.playbackRate ?? 1, startTime);

	highpass.type = "highpass";
	highpass.frequency.setValueAtTime(options.highpass ?? 240, startTime);
	highpass.Q.setValueAtTime(0.55, startTime);

	bandpass.type = "bandpass";
	bandpass.frequency.setValueAtTime(options.bandpass ?? 1800, startTime);
	bandpass.Q.setValueAtTime(0.85, startTime);

	lowpass.type = "lowpass";
	lowpass.frequency.setValueAtTime(options.lowpass ?? 4200, startTime);
	lowpass.Q.setValueAtTime(0.6, startTime);

	gain.gain.setValueAtTime(0.0001, startTime);
	gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.12);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

	source.connect(highpass);
	highpass.connect(bandpass);
	bandpass.connect(lowpass);

	if (panner) {
		panner.pan.setValueAtTime(options.pan ?? 0, startTime);
		lowpass.connect(panner);
		panner.connect(gain);
	} else {
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

export function playGameSound(name: GameSoundName) {
	const now = performance.now();

	if (name === "button") {
		if (now - lastButtonSoundAt < 35) return;
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
		if (now - lastCardSelectSoundAt < 80) return;
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
		if (now - lastDealSoundAt < 430) return;
		lastDealSoundAt = now;

		playFileSound("deal", {
			volume: 0.82,
			playbackRate: 1.12,
			startTime: 0.08,
		});
		return;
	}

	if (name === "returnDeck") {
		if (now - lastReturnSoundAt < RETURN_SOUND_THROTTLE_MS) return;
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
	document.addEventListener(
		"pointerdown",
		(event) => {
			unlockGameAudio();

			const target = event.target as HTMLElement | null;

			if (!target) return;

			const isHandOrDraftCard = Boolean(
				target.closest(
					"[data-hand-card-id], [data-draft-card-id], .hand-card, .daily-draft-card",
				),
			);
			const boardMiniCard = target.closest(".board-mini");

			if (isHandOrDraftCard) {
				return;
			}

			if (boardMiniCard) {
				playGameSound("cardSelect");
				return;
			}

			playGameSound("button");
		},
		true,
	);
}
