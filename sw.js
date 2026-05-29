const CACHE_NAME = 'trekkopoly-v1';

// Danh sách các file cần lưu vào bộ nhớ đệm để chơi offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './build/client.js',
    './build/client.css',
    '/assets/videos/chuyencanh2.mp4',
    '/assets/images/cities/danang.jpg',
    '/assets/images/cities/hanoi.jpeg',
    '/assets/images/cities/saigon.jpg',
    '/assets/images/backgrounds/lobby-bg.jpg',
    '/assets/images/backgrounds/saigon-collage-hover/saigon-collage-bg.png',
    '/assets/audio/music/in-game-background.mp3',
];

// 1. Sự kiện Cài đặt (Install) - Gom hàng vào kho Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Đang nạp các file tĩnh vào bộ nhớ đệm...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting()) // Buộc SW mới kích hoạt ngay lập tức
    );
});

// 2. Sự kiện Kích hoạt (Activate) - Dọn dẹp cache cũ khi nâng cấp version (v2, v3...)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Đang xóa cache cũ:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Chiến lược Cache-First
// Khi game yêu cầu file, SW sẽ lục trong bộ nhớ máy trước, nếu không có mới lên mạng tải
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Trả về file trong máy ngay lập tức (< 1s)
            }
            return fetch(event.request); // Nếu máy chưa có thì mới lên mạng lấy
        })
    );
});