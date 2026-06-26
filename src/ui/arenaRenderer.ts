import { state } from "../state/gameState.js";
import { renderMainArena } from "./arena.js";
import {
  getRemainingResources,
  isDraftDealVisualActive,
} from "../game/queries.js";

// ── Floating text animation ───────────────────────────────────

export function spawnFloatingText(
  selector: string,
  delta: number,
  type: "coin" | "stamina",
) {
  const container = document.querySelector(selector);
  if (!container) return;
  const textNode = document.createElement("div");
  textNode.className = `floating-text floating-text--${type}`;
  textNode.textContent = `${delta > 0 ? "+" : ""}${delta}`;
  container.appendChild(textNode);
  container.classList.remove("resource-pulse");
  void container.clientWidth; // force reflow
  container.classList.add("resource-pulse");
  setTimeout(() => textNode.remove(), 1200);
}

// ── Arena re-render ────────────────────────────────────────────

export function rerenderArena() {
  const arena = document.querySelector(".arena");
  if (!arena) return;

  const newArena =
    (new DOMParser()).parseFromString(renderMainArena(), "text/html").body
      .firstElementChild;
  if (newArena) arena.replaceWith(newArena);

  if (isDraftDealVisualActive()) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        restartDraftCenterDealVisuals();
      });
    });
  }

  requestAnimationFrame(() => {
    const remaining = getRemainingResources();
    if (
      state.lastAnimatedCoin !== -1 &&
      remaining.coin !== state.lastAnimatedCoin
    ) {
      spawnFloatingText(
        ".resource-orb--coin .resource-orb__frame",
        remaining.coin - state.lastAnimatedCoin,
        "coin",
      );
    }
    if (
      state.lastAnimatedStamina !== -1 &&
      remaining.stamina !== state.lastAnimatedStamina
    ) {
      spawnFloatingText(
        ".resource-orb--stamina .resource-orb__frame",
        remaining.stamina - state.lastAnimatedStamina,
        "stamina",
      );
    }
    state.lastAnimatedCoin = remaining.coin;
    state.lastAnimatedStamina = remaining.stamina;
  });
}

// ── Draft deal visual restart ──────────────────────────────────

export function restartDraftCenterDealVisuals(): boolean {
  const overlay = document.querySelector(
    ".draft-center-overlay",
  ) as HTMLElement | null;
  if (!overlay) return false;

  overlay.classList.remove("draft-center-overlay--dealing");

  const wrappers = overlay.querySelectorAll(".draft-center-card-wrapper");
  wrappers.forEach((node) => {
    const wrapper = node as HTMLElement;
    wrapper.classList.remove("draft-center-card-wrapper--flown-to-hand");
    wrapper.style.animation = "none";
  });

  void overlay.offsetWidth;

  wrappers.forEach((node) => {
    (node as HTMLElement).style.removeProperty("animation");
  });

  overlay.classList.add("draft-center-overlay--dealing");
  return true;
}
