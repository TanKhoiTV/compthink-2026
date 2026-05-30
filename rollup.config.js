const typescript = require('@rollup/plugin-typescript');
const replace = require('@rollup/plugin-replace');

module.exports = {
  input: 'src/app.ts', // Lấy file gốc ở đây
  output: {
    file: 'build/client.js', // Đóng gói xong thì xuất ra đây
    format: 'iife', // Định dạng chuẩn cho trình duyệt
    sourcemap: true
  },
  plugins: [
    replace({
      preventAssignment: false,
      '__BUILD_TIME_PLACEHOLDER__': () => new Date().toLocaleString('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).replace(',', '')
    }),
    typescript()
  ]
};