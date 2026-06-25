const CACHE_NAME = "trekkopoly-v5";

// Danh sách các file cần lưu vào bộ nhớ đệm để chơi offline
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./manifest.json",
	"./build/client.js",
	"./build/client.css",
	"assets/images/cities/danang.jpg",
	"assets/images/cities/hanoi.jpeg",
	"assets/images/cities/saigon.jpg",
	"assets/images/backgrounds/lobby-bg.jpg",
	"assets/images/backgrounds/saigon-collage-hover/saigon-collage-bg.png",
];

// 1. Sự kiện Cài đặt (Install) - Gom hàng vào kho Cache
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("SW: Đang nạp các file tĩnh vào bộ nhớ đệm...");
				return cache.addAll(ASSETS_TO_CACHE);
			})
			.then(() => self.skipWaiting()),
	);
});

// 2. Sự kiện Kích hoạt (Activate) - Dọn dẹp cache cũ
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cache) => {
						if (cache !== CACHE_NAME) {
							console.log("SW: Đang xóa cache cũ:", cache);
							return caches.delete(cache);
						}
					}),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// 4. Lắng nghe lệnh từ trang — SKIP_WAITING để SW mới active ngay
self.addEventListener("message", (event) => {
	if (event.data === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

// 3. Chiến lược: Network-First cho app shell, Network-Only cho media.
//    - App shell (JS, CSS, HTML): network-first, cache fallback offline.
//    - Media (video, audio): network-only — too large to cache, avoid stream clone errors.
//    - API/WebSocket requests to remote server: network-only — POST can't be cached
//      and cache.put() rejects on non-GET, causing the whole fetch to hang.
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Skip caching for large media files — serve from network only
	if (url.pathname.match(/\.(mp4|webm|ogg|mp3|wav|m4a|mov)$/i)) {
		return;
	}

	// Skip caching for API requests to the remote game server
	if (url.hostname !== location.hostname) {
		return;
	}

	// Only cache GET requests — POST/PUT/DELETE can't be stored in Cache API
	if (event.request.method !== "GET") {
		return;
	}

	event.respondWith(
		caches.open(CACHE_NAME).then((cache) => {
			return fetch(event.request)
				.then((network) => {
					cache.put(event.request, network.clone());
					return network;
				})
				.catch(() => cache.match(event.request));
		}),
	);
});
