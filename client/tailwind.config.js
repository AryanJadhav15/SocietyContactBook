export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17202A',
        surface: '#F6F8FB',
        brand: '#256D85',
        accent: '#7C9D4E'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(23, 32, 42, 0.08)'
      }
    }
  },
  plugins: []
};
