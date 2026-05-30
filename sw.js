const CACHE_NAME = "trekkopoly-v5";

// Danh sách các file cần lưu vào bộ nhớ đệm để chơi offline
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./manifest.json",
	"./build/client.js",
	"./build/client.css",
	"assets/videos/chuyencanh2.mp4",
	"assets/images/cities/danang.jpg",
	"assets/images/cities/hanoi.jpeg",
	"assets/images/cities/saigon.jpg",
	"assets/images/backgrounds/lobby-bg.jpg",
	"assets/images/backgrounds/saigon-collage-hover/saigon-collage-bg.png",
	"assets/audio/music/in-game-background.mp3",
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

// 3. Chiến lược: Network-First cho mọi thứ.
//    - Luôn fetch từ network trước. Cache là fallback offline.
//    - Một lần refresh là nhận được bản mới nhất từ deploy.
//    - Cache được cập nhật ở background khi fetch thành công.
self.addEventListener("fetch", (event) => {
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
