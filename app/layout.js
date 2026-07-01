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
        <style>{`:root { --primary: #1E3A4D; --teal: #2C6E5C; --muted-teal: #5F8A7B; --estateRed: #B26A5C }`}</style>
      </head>
      <body className="bg-cloud font-body text-midnight">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
