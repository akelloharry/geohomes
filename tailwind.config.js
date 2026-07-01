module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
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
