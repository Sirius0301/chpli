/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 优先级颜色
        priority: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#3B82F6',
        },
        // 日历主题色（苹果风格）
        calendar: {
          primary: '#34D399', // 周/月切换按钮的绿色
          border: '#E5E7EB',
          bg: '#F9FAFB',
          hover: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
