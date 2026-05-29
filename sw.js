const CACHE_NAME = "trekkopoly-v2";

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
			.then(() => self.skipWaiting()), // Buộc SW mới kích hoạt ngay lập tức
	);
});

// 2. Sự kiện Kích hoạt (Activate) - Dọn dẹp cache cũ khi nâng cấp version (v2, v3...)
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

// 3. Chiến lược lai (Hybrid):
//    - Build assets (JS/CSS): Stale-While-Revalidate — phục vụ ngay từ cache,
//      đồng thời tải bản mới ở nền và cập nhật cache cho lần sau.
//      Giúp game luôn chạy code mới nhất sau mỗi lần deploy mà không cần
//      người dùng xoá cache hay hard refresh.
//    - Static assets (ảnh, nhạc, video): Cache-First — không đổi thường xuyên.
//    - index.html: Network-First — luôn lấy bản mới từ server.
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);
	const isBuildAsset =
		url.pathname.endsWith("/build/client.js") ||
		url.pathname.endsWith("/build/client.css");
	const isIndex =
		url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

	if (isBuildAsset) {
		// Stale-While-Revalidate for JS/CSS
		event.respondWith(
			caches.open(CACHE_NAME).then((cache) => {
				return cache.match(event.request).then((cached) => {
					const fetchPromise = fetch(event.request)
						.then((network) => {
							cache.put(event.request, network.clone());
							return network;
						})
						.catch(() => cached); // fallback to cache if offline
					return cached || fetchPromise;
				});
			}),
		);
	} else if (isIndex) {
		// Network-First for index.html
		event.respondWith(
			fetch(event.request).catch(() => caches.match(event.request)),
		);
	} else {
		// Cache-First for everything else (images, audio, fonts, etc.)
		event.respondWith(
			caches
				.match(event.request)
				.then((cached) => cached || fetch(event.request)),
		);
	}
});
