import { state } from "../state/gameState.js";
import { isOnlineRoomActive } from "../game/queries.js";
import { getCurrentReplayStep } from "../ui/renderHelpers.js";
import { type GameSoundName, playGameSound } from "./gameAudio.js";
import { onlineClientState } from "../online/socketClient.js";
import { cleanupDashboardHub } from "../ui/dashboard.js";
import type { SimulationReplayStep } from "../game/scoring.js";

// ── Constants ────────────────────────────────────────────────────────────────

const IN_GAME_BACKGROUND_MUSIC_SRC = "assets/sounds/in-game-background.mp3";
const IN_GAME_MUSIC_MUTED_KEY = "travelDeck.inGameMusicMuted";
const IN_GAME_MUSIC_VOLUME_KEY = "travelDeck.state.inGameMusicVolume";
const DEFAULT_IN_GAME_MUSIC_VOLUME = 0.5;

// ── Simulation scan sound helpers ────────────────────────────────────────────

/*
  Event xấu hiện tại:
  - traffic: kẹt xe
  - storm: mưa giông
  - distance: khoảng cách > 20km
  - promo là event tốt nên không dùng scanBad.
*/
function isBadSimulationReplayStep(step: SimulationReplayStep | null) {
  if (!step) return false;

  const stepData = step as SimulationReplayStep & {
    isNegativeEvent?: boolean;
  };

  return (
    stepData.isBadEvent === true ||
    stepData.isNegativeEvent === true ||
    stepData.eventType === "traffic" ||
    stepData.eventType === "storm" ||
    stepData.eventType === "distance"
  );
}

function getSimulationEventSoundName(
  step: SimulationReplayStep | null,
): GameSoundName | null {
  if (!step?.eventType) return null;

  if (step.eventType === "promo") return "eventPromo";
  if (step.eventType === "traffic") return "eventTraffic";
  if (step.eventType === "storm") return "eventStorm";
  if (step.eventType === "distance") return "eventDistance";

  return null;
}

export function playSimulationScanSoundForCurrentStep() {
  const step = getCurrentReplayStep();

  if (!step) return;

  const eventSoundName = getSimulationEventSoundName(step);

  /*
    Event có sound riêng.
    Ô bình thường vẫn dùng ding scan.
  */
  playGameSound(
    eventSoundName ??
      (isBadSimulationReplayStep(step) ? "scanBad" : "scanCell"),
  );
}

// ── In-game background music ──────────────────────────────────────────────────

/*
  Mặc định nhạc trong game phải bắt đầu ở 50%.
  Nếu localStorage cũ từng lưu 0 do các bản trước, reset về 50% để không còn hiện 0%.
*/

export function clampInGameMusicVolume(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function getInGameBackgroundMusic() {
  if (!state.inGameBackgroundMusic) {
    const audio = new Audio(IN_GAME_BACKGROUND_MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = clampInGameMusicVolume(state.inGameMusicVolume);
    audio.muted = state.isInGameMusicMuted;
    state.inGameBackgroundMusic = audio;
  }

  return state.inGameBackgroundMusic;
}

export function shouldPlayInGameMusic() {
  return isOnlineRoomActive() &&
    onlineClientState.roomState?.phase !== "lobby";
}

export function stopOutsideBackgroundMedia() {
  /*
    Tắt hẳn audio/video nền ngoài màn chơi, đặc biệt là video hero ở dashboard.
    Không đụng tới audio nền riêng trong game.
  */
  cleanupDashboardHub();
  document.querySelectorAll("audio, video").forEach((media) => {
    if (media === state.inGameBackgroundMusic) return;

    const element = media as HTMLMediaElement;

    try {
      element.pause();
      element.muted = true;

      if (
        element.id === "hub-hero-video" ||
        element.classList.contains("hub-hero__video")
      ) {
        element.currentTime = 0;
      }
    } catch {
      // Ignore browsers that block pausing detached media.
    }
  });
}

export function syncInGameBackgroundMusic() {
  const audio = getInGameBackgroundMusic();

  audio.volume = clampInGameMusicVolume(state.inGameMusicVolume);
  audio.muted = state.isInGameMusicMuted;

  if (!shouldPlayInGameMusic()) {
    audio.pause();
    return;
  }

  stopOutsideBackgroundMedia();

  if (state.isInGameMusicMuted || state.inGameMusicVolume <= 0) {
    audio.pause();
    return;
  }

  void audio.play().catch(() => {
    /*
      Browser chỉ cho autoplay sau thao tác người dùng.
      setupInGameMusicDelegation sẽ gọi lại hàm này ở pointerdown/click tiếp theo.
    */
  });
}

export function updateInGameMusicMenuDom() {
  const button = document.querySelector<HTMLButtonElement>(
    "[data-in-game-music-toggle]",
  );
  const value = document.querySelector<HTMLElement>(
    "[data-in-game-music-value]",
  );
  const slider = document.querySelector<HTMLInputElement>(
    "[data-in-game-music-slider]",
  );

  if (button) {
    button.classList.toggle(
      "is-muted",
      state.isInGameMusicMuted || state.inGameMusicVolume <= 0,
    );
    button.textContent =
      state.isInGameMusicMuted || state.inGameMusicVolume <= 0 ? "🔇" : "🔊";
    button.title = state.isInGameMusicMuted ? "Bật nhạc nền" : "Tắt nhạc nền";
  }

  if (value) {
    value.textContent = `${
      Math.round(
        clampInGameMusicVolume(state.inGameMusicVolume) * 100,
      )
    }%`;
  }

  if (slider) {
    slider.value = String(
      Math.round(
        clampInGameMusicVolume(state.inGameMusicVolume) * 100,
      ),
    );
  }
}

export function toggleInGameBackgroundMusic() {
  state.isInGameMusicMuted = !state.isInGameMusicMuted;
  localStorage.setItem(
    IN_GAME_MUSIC_MUTED_KEY,
    String(state.isInGameMusicMuted),
  );

  if (
    !state.isInGameMusicMuted &&
    state.inGameMusicVolume <= 0
  ) {
    state.inGameMusicVolume = DEFAULT_IN_GAME_MUSIC_VOLUME;
    localStorage.setItem(
      IN_GAME_MUSIC_VOLUME_KEY,
      String(state.inGameMusicVolume),
    );
  }

  syncInGameBackgroundMusic();
  updateInGameMusicMenuDom();
}

export function setInGameBackgroundMusicVolume(value: string | number) {
  const normalizedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(normalizedValue)) return;

  state.inGameMusicVolume = clampInGameMusicVolume(
    normalizedValue > 1 ? normalizedValue / 100 : normalizedValue,
  );
  state.isInGameMusicMuted = state.inGameMusicVolume <= 0;

  localStorage.setItem(
    IN_GAME_MUSIC_VOLUME_KEY,
    String(state.inGameMusicVolume),
  );
  localStorage.setItem(
    IN_GAME_MUSIC_MUTED_KEY,
    String(state.isInGameMusicMuted),
  );

  syncInGameBackgroundMusic();
  updateInGameMusicMenuDom();
}

export function renderInGameMusicControl() {
  const volumePercent = Math.round(
    clampInGameMusicVolume(state.inGameMusicVolume) * 100,
  );
  const isMuted = state.isInGameMusicMuted || volumePercent <= 0;

  return `
    <div class="online-room-menu__music" title="Nhạc nền trong trận">
      <button
        type="button"
        class="online-room-menu__music-toggle ${isMuted ? "is-muted" : ""}"
        data-in-game-music-toggle
        onclick="event.stopPropagation(); window.toggleInGameBackgroundMusic()"
        title="${isMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}"
      >
        ${isMuted ? "🔇" : "🔊"}
      </button>

      <div class="online-room-menu__music-body">
        <div class="online-room-menu__music-head">
          <span>Nhạc nền</span>
          <strong data-in-game-music-value>${volumePercent}%</strong>
        </div>

        <input
          data-in-game-music-slider
          class="online-room-menu__music-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${volumePercent}"
          oninput="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
          onchange="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
        />
      </div>
    </div>
  `;
}

export function setupInGameMusicDelegation() {
  const tryPlay = () => {
    syncInGameBackgroundMusic();
  };

  document.addEventListener("pointerdown", tryPlay, {
    passive: true,
  });
  document.addEventListener("keydown", tryPlay);
}
