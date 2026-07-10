import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { AuthProvider } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'GeoHome Kenya',
  description: 'Find homes near you'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/placeholder.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`:root { --official-teal: #2C6E5C; --muted-teal: #5F8A7B; --deep-maritime: #1E3A4D; --cloud-white: #F4F6F9; --pale-steel: #BECCD9; --anchor-gray: #5B6F82; --estate-red: #B26A5C; --mint-hint: #D9E8E2; --geohome-gold: #FBBF24; --trust-teal: #14B8A6; }`}</style>
      </head>
      <body className="bg-cloud-white font-body text-anchor-gray">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
