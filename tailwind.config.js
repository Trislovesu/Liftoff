/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          900: '#0a0b10',
          800: '#10121b',
          700: '#161927',
          600: '#1d2031'
        },
        accent: {
          DEFAULT: '#7c5cff',
          glow: '#9b7bff'
        },
        xp: '#38e1b0',
        danger: '#ff5e7a',
        gold: '#ffcc4d',
        platinum: '#c5d0e6',
        diamond: '#7ee8ff'
      },
      boxShadow: {
        glow: '0 0 30px rgba(124,92,255,0.35)',
        card: '0 8px 24px rgba(0,0,0,0.35)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'card-grad': 'linear-gradient(135deg, rgba(124,92,255,0.12), rgba(56,225,176,0.08))',
        'hero-grad': 'radial-gradient(circle at 20% 0%, rgba(124,92,255,0.35), transparent 60%), radial-gradient(circle at 80% 20%, rgba(56,225,176,0.18), transparent 50%)'
      }
    }
  },
  plugins: []
}
