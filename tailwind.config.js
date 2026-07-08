/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sagrada dice colors (jewel tones)
        dice: {
          red: '#B8213A',      // Ruby
          blue: '#1E4A8F',     // Sapphire
          green: '#1E7A4F',    // Emerald
          yellow: '#D4A017',   // Amber
          purple: '#6B2C7A',   // Amethyst
        },
        // Gothic cathedral palette
        cathedral: {
          void: '#0A0713',       // Deep midnight
          nave: '#161029',       // Nave shadow
          stone: '#2A2140',      // Stone lit
          glow: '#3F2A5C',       // Candle glow purple
          candle: '#F5C15E',     // Candle flame
          gold: '#D4AF37',       // Gold leaf
          goldLight: '#F5D573',  // Highlight
          parchment: '#EFE4C4',  // Text on dark
        },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'Georgia', 'serif'],
        serif: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)',
        'stained': '0 0 30px rgba(184, 33, 58, 0.3), 0 0 60px rgba(30, 74, 143, 0.2)',
        'deep': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: {
        'cathedral-radial': 'radial-gradient(ellipse at top, #3F2A5C 0%, #161029 45%, #0A0713 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F5D573 50%, #D4AF37 100%)',
      },
      animation: {
        'flicker': 'flicker 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
