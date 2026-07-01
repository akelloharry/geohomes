module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}'
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
        'trust-teal': '#14B8A6',
        primary: '#1E3A4D',
        teal: '#2C6E5C',
        mutedTeal: '#5F8A7B',
        paleSteel: '#BECCD9',
        midnight: '#1F2937',
        anchorGray: '#5B6F82',
        cloud: '#F4F6F9',
        estateRed: '#B26A5C',
        mintHint: '#D9E8E2'
      },
      fontFamily: {
        heading: ['Merriweather', 'serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
