import { NextResponse, type NextRequest } from 'next/server'
import { verifySignedToken, SESSION_COOKIE } from '@/lib/session'

const APP_ROUTES = [
  '/dashboard',
  '/checkin',
  '/feed',
  '/classement',
  '/historique',
  '/profil',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const signed = request.cookies.get(SESSION_COOKIE)?.value ?? ''
  const isAuthenticated = verifySignedToken(signed) !== null

  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r))

  if (!isAuthenticated && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/join'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && pathname === '/join') {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api|.*\\.svg$).*)'],
}
