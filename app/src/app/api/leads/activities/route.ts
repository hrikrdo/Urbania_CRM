import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("lead_id")
  if (!leadId) return NextResponse.json({ activities: [] })
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, type, title, description, is_automated, created_at
       FROM activities WHERE lead_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [leadId]
    )
    return NextResponse.json({ activities: result.rows })
  } finally { client.release() }
}
