import { authClientState } from "../online/socketClient.ts";

export const HERO_VIDEO_SRC = "assets/videos/one-minute-in-vietnam.mp4";

export function initDashboardHub() {
	const media = document.getElementById("hub-hero-media") as HTMLElement | null;
	const video = document.getElementById(
		"hub-hero-video",
	) as HTMLVideoElement | null;
	const hitarea = document.getElementById(
		"hub-hero-video-hitarea",
	) as HTMLButtonElement | null;
	const muteButton = document.getElementById(
		"hub-hero-video-mute",
	) as HTMLButtonElement | null;
	const volumeSlider = document.getElementById(
		"hub-hero-video-volume",
	) as HTMLInputElement | null;

	if (!media || !video || !hitarea || !muteButton || !volumeSlider) return;

	video.playsInline = true;
	video.volume = parseFloat(volumeSlider.value) || 0.85;

	const updateVideoStatus = () => {
		media.classList.toggle("hub-hero__media--paused", video.paused);

		muteButton.classList.toggle(
			"hub-hero__video-mute--muted",
			video.muted || video.volume === 0,
		);
		muteButton.classList.toggle(
			"hub-hero__video-mute--unmuted",
			!video.muted && video.volume > 0,
		);
		muteButton.setAttribute(
			"aria-label",
			video.muted || video.volume === 0 ? "Bật tiếng video" : "Tắt tiếng video",
		);
		muteButton.setAttribute(
			"aria-pressed",
			video.muted || video.volume === 0 ? "true" : "false",
		);

		volumeSlider.value = video.volume.toString();

		if (video.paused) {
			hitarea.setAttribute("aria-label", "Tiếp tục video");
			return;
		}

		hitarea.setAttribute("aria-label", "Tạm dừng video");
	};

	const tryAutoplay = async () => {
		video.muted = false;

		try {
			await video.play();
			updateVideoStatus();
			return;
		} catch {
			video.muted = true;

			try {
				await video.play();
			} catch {
				/* Autoplay blocked entirely */
			}

			updateVideoStatus();
		}
	};

	muteButton.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (video.muted) {
			video.muted = false;
			if (video.volume === 0) video.volume = 0.5;
		} else {
			video.muted = true;
		}

		if (!video.paused) {
			void video.play();
		}

		updateVideoStatus();
	});

	hitarea.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (video.paused) {
			void video.play();
		} else {
			video.pause();
		}

		updateVideoStatus();
	});

	video.addEventListener("play", updateVideoStatus);
	video.addEventListener("pause", updateVideoStatus);
	video.addEventListener("volumechange", updateVideoStatus);

	volumeSlider.addEventListener("input", (event) => {
		event.stopPropagation();
		const val = parseFloat(volumeSlider.value);
		video.volume = val;
		if (val > 0) {
			video.muted = false;
		}
	});

	void tryAutoplay();

	if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
		video.addEventListener(
			"loadeddata",
			() => {
				void tryAutoplay();
			},
			{ once: true },
		);
	}
}
