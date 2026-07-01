import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/agent', '/admin', '/properties/new']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (!isProtected) return NextResponse.next()

  // Check for Supabase auth cookies - broader check for auth state
  const hasAuth = req.cookies.has('sb-access-token') || req.cookies.has('sb-session') || req.cookies.has('sb-auth-token')

  if (!hasAuth) {
    // Allow the request through - client-side AuthContext will handle redirects
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/agent/:path*', '/admin/:path*', '/properties/new']
}
