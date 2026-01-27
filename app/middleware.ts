import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If no Supabase config, skip auth
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const pathname = request.nextUrl.pathname

  // Skip auth for API routes (cron jobs, webhooks, etc.)
  if (pathname.startsWith("/api/")) {
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = pathname.startsWith("/login")

    // All CRM routes that require authentication
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

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return response
  } catch {
    return response
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
