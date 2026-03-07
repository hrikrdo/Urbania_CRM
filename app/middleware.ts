import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    return NextResponse.next({ request })
  }

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login")
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/comercial") ||
    pathname.startsWith("/pool") ||
    pathname.startsWith("/tramites") ||
    pathname.startsWith("/agenda") ||
    pathname.startsWith("/cierre") ||
    pathname.startsWith("/cobranza") ||
    pathname.startsWith("/marketing") ||
    pathname.startsWith("/reportes") ||
    pathname.startsWith("/equipo") ||
    pathname.startsWith("/postventa") ||
    pathname.startsWith("/proyectos") ||
    pathname.startsWith("/configuracion")

  const sessionCookie = request.cookies.get("sb-session")
  let isAuthenticated = false

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value)
      isAuthenticated = !!(session.access_token && Date.now() / 1000 < session.expires_at)
    } catch {
      isAuthenticated = false
    }
  }

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
