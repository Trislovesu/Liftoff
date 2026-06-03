/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          900: '#111111',
          800: '#1a1a1a',
          700: '#222222',
          600: '#2a2a2a'
        },
        accent: {
          DEFAULT: '#e0e0e0',
          glow: '#ffffff'
        },
        xp: '#38e1b0',
        danger: '#ff5e7a',
        gold: '#ffcc4d',
        platinum: '#c5d0e6',
        diamond: '#7ee8ff'
      },
      boxShadow: {
        glow: '0 0 30px rgba(255,255,255,0.15)',
        card: '0 8px 24px rgba(0,0,0,0.4)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'card-grad': 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        'hero-grad': 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.02), transparent 50%)'
      }
    }
  },
  plugins: []
}
