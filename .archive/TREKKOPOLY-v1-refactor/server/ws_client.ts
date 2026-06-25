const url = Deno.args[0];
if (!url) {
  console.error("Vui lòng nhập URL WebSocket!");
  Deno.exit(1);
}

try {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("=== Đã kết nối thành công! Nhập JSON để chơi ===");
  };

  ws.onmessage = (e) => {
    console.log("\n[Server phản hồi]:", JSON.stringify(JSON.parse(e.data), null, 2));
  };

  ws.onclose = () => {
    console.log("=== Mất kết nối từ Server ===");
    Deno.exit(0);
  };

  ws.onerror = (err) => {
    console.error("Lỗi kết nối:", err);
  };

  // Đọc dữ liệu từ bàn phím để gửi lên server
  const buf = new Uint8Array(1024);
  while (true) {
    const n = await Deno.stdin.read(buf);
    if (n === null) break;
    // SỬA TẠI ĐÂY: Thay substring bằng subarray
    const input = new TextDecoder().decode(buf.subarray(0, n)).trim();
    if (input && ws.readyState === WebSocket.OPEN) {
      ws.send(input);
    }
  }
} catch (err) {
  console.error("Không thể khởi chạy client:", err);
}
