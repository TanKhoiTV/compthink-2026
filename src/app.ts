const gameName: string = "Trekkopoly";
console.log(`${gameName} đã sẵn sàng hoạt động!`);

const board = document.getElementById('board') as HTMLElement;

// Tạo 15 ô (3 hàng x 5 cột)
for (let i = 0; i < 15; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerText = `Ô ${i + 1}`;
    board.appendChild(slot);
}


// Đăng ký Service Worker cho tính năng PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW: Đăng ký thành công với scope:', registration.scope);
            })
            .catch((error) => {
                console.error('SW: Đăng ký thất bại ', error);
            });
    });
}