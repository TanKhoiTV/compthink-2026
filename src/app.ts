import { setupGameAudioDelegation } from "./audio/gameAudio.ts";
import { rerenderGameShell } from "./router.ts";

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

// Start the app — render the game screen
rerenderGameShell();
