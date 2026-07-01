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
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-cloud-white font-body text-anchor-gray">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
