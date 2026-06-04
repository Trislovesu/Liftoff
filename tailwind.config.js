/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#0a0a0a',
          900: '#131313',
          800: '#1a1a1a',
          700: '#2e2e2e',
          600: '#353534'
        },
        accent: {
          DEFAULT: '#ff0033',
          glow: '#ff5357'
        },
        xp: '#ff0033',
        danger: '#ffb4ab',
        gold: '#ffcc4d',
        platinum: '#c5d0e6',
        diamond: '#7ee8ff'
      },
      boxShadow: {
        glow: '0 4px 18px rgba(255,0,51,0.22)',
        card: '0 0 0 1px rgba(255,255,255,0.04)'
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Geist', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'card-grad': 'linear-gradient(135deg, rgba(255,0,51,0.10), rgba(26,26,26,0.92) 42%, rgba(46,46,46,0.62))',
        'hero-grad': 'radial-gradient(circle at 20% 0%, rgba(255,0,51,0.16), transparent 34%), radial-gradient(circle at 100% 15%, rgba(255,83,87,0.08), transparent 32%), linear-gradient(180deg, #131313 0%, #0a0a0a 100%)'
      }
    }
  },
  plugins: []
}
