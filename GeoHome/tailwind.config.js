module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'official-teal': '#2C6E5C',
        'muted-teal': '#5F8A7B',
        'deep-maritime': '#1E3A4D',
        'cloud-white': '#F4F6F9',
        'pale-steel': '#BECCD9',
        'anchor-gray': '#5B6F82',
        'estate-red': '#B26A5C',
        'mint-hint': '#D9E8E2',
        'geohome-gold': '#FBBF24',
        'trust-teal': '#14B8A6'
      },
      fontFamily: {
        heading: ['Merriweather', 'serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
