const CACHE_NAME = "trekkopoly-cache-v1";

// Danh sách toàn bộ file cần thiết để game offline
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",

  "./build/app.js",
  "./build/types.js",
  "./build/client.css",

  "https://cdn.socket.io/4.8.1/socket.io.min.js",

  "/assets/chuyencanh2.mp4",
  "/assets/danang.jpg",
  "/assets/hanoi.jpeg",
  "/assets/saigon.jpg",
  "/assets/backgrounds/lobby-background.jpg",
  "/assets/backgrounds/saigon-collage-hover/saigon-collage-bg.png",
  "/assets/sounds/in-game-background.mp3",
];

// 1. Quá trình Cài đặt (Install): Tải và cất vào cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("SW: Đang lưu trữ tài nguyên vào Cache...");
        // Dùng catch để lỡ có thiếu 1 file mp3 nào đó thì SW vẫn cài đặt thành công
        return cache.addAll(urlsToCache).catch((err) =>
          console.warn("Lỗi khi cache tài nguyên tĩnh:", err)
        );
      }),
  );
});

// 2. Quá trình Dọn dẹp (Activate): Xóa kho cũ nếu đổi CACHE_NAME (ví dụ lên v2, v3)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("SW: Đang xóa cache cũ:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// 3. Quá trình Đánh chặn (Fetch): Chiến thuật "Network First, Fallback to Cache"
self.addEventListener("fetch", (event) => {
  // Bỏ qua các request gửi API lên server thật hoặc các request không phải GET
  if (
    event.request.method !== "GET" || event.request.url.includes("/socket.io/")
  ) return;

  event.respondWith(
    // Ưu tiên ra Internet lấy file mới nhất (vì code thay đổi liên tục)
    fetch(event.request)
      .then((networkResponse) => {
        // Nếu lấy được file mới, cất luôn một bản copy vào kho để update
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Rớt mạng thì lấy trong cache ra xài
        return caches.match(event.request);
      }),
  );
});
