import { setupGameAudioDelegation } from "./audio/gameAudio.ts";
import { transitionToScreen } from "./router.ts";
import {
	setDeck,
	setPlayerHand,
	setCurrentDayIndex,
	setIsDraftPhase,
} from "./state.ts";
import {
	createInitialDeck,
	shuffleCards,
	drawDailyHandFromDeck,
} from "../scr/shared/deck.ts";
import { saigonFoodCards } from "../scr/shared/data/index.ts";
import { HAND_SIZE } from "../scr/shared/constants.ts";

const gameName = "Trekkopoly";
console.log(`${gameName} running!`);

// Initialise audio
setupGameAudioDelegation();

// Register service worker
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("./sw.js")
			.then((reg) => console.log("SW registered:", reg.scope))
			.catch((err) => console.error("SW failed:", err));
	});
}

// ── Initialise demo game state ──────────────────────────────────────────────
// Deal cards from the Saigon food deck and jump straight to the game screen.
// (No server connection needed for the static Pages demo.)

const deck = createInitialDeck({
	cards: saigonFoodCards,
	fallbackCards: [],
	handSize: HAND_SIZE,
});

const shuffled = shuffleCards(deck);
const { deck: remainingDeck, hand } = drawDailyHandFromDeck({
	deck: shuffled,
	handSize: HAND_SIZE,
	shuffleCards,
});

setDeck(remainingDeck);
setPlayerHand(hand);
setCurrentDayIndex(0);
setIsDraftPhase(false); // Skip draft for demo — show the board immediately

// Start the app — render the game screen
transitionToScreen("game");
