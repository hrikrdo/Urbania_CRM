import { NextRequest, NextResponse } from "next/server"

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  }

  const session = await res.json()
  if (!session.access_token) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  }

  const cookieName = "sb-session"
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, JSON.stringify({
    access_token: session.access_token,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: session.user,
  }), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
// supabase https: supabase.hrikrdo.com
