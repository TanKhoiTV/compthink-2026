const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: 'src/app.ts', // Lấy file gốc ở đây
  output: {
    file: 'build/client.js', // Đóng gói xong thì xuất ra đây
    format: 'iife', // Định dạng chuẩn cho trình duyệt
    sourcemap: true
  },
  plugins: [typescript()] // Bật tính năng dịch TypeScript
};