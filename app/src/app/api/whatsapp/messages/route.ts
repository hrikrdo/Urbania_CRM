import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("lead_id")
  if (!leadId) return NextResponse.json({ messages: [] })

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT m.id, m.direction, m.content, m.created_at
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.lead_id = $1
       ORDER BY m.created_at ASC`,
      [leadId]
    )
    return NextResponse.json({ messages: result.rows })
  } finally {
    client.release()
  }
}
