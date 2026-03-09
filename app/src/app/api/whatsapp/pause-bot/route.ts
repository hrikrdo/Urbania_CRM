import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: NextRequest) {
  const { lead_id, paused } = await req.json()
  if (!lead_id) return NextResponse.json({ error: "lead_id requerido" }, { status: 400 })
  const client = await pool.connect()
  try {
    await client.query(
      "UPDATE leads SET bot_paused = $1, updated_at = NOW() WHERE id = $2",
      [paused, lead_id]
    )
    // Insertar actividad
    const label = paused ? "Bot pausado — atención humana activada" : "Bot reactivado — Valeria retoma la conversación"
    await client.query(
      "INSERT INTO activities (lead_id, type, title, description, is_automated) VALUES ($1,'system_notification',$2,$3,true)",
      [lead_id, paused ? "🤝 Modo humano activado" : "🤖 Bot reactivado", label]
    )
    return NextResponse.json({ ok: true, bot_paused: paused })
  } finally { client.release() }
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")
  if (!phone) return NextResponse.json({ bot_paused: false })
  const client = await pool.connect()
  try {
    const res = await client.query(
      "SELECT bot_paused FROM leads WHERE phone = $1 ORDER BY created_at DESC LIMIT 1",
      [phone]
    )
    return NextResponse.json({ bot_paused: res.rows[0]?.bot_paused ?? false })
  } finally { client.release() }
}
