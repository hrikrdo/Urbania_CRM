import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "308759678989211"
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN

export async function POST(req: NextRequest) {
  try {
    const { lead_id, phone, message, agent_name } = await req.json()
    if (!phone || !message) return NextResponse.json({ error: "phone y message requeridos" }, { status: 400 })

    const cleanPhone = phone.replace(/\D/g, "")

    // 1. Enviar mensaje via WhatsApp Cloud API
    const waRes = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message, preview_url: false },
      }),
    })

    if (!waRes.ok) {
      const err = await waRes.json()
      return NextResponse.json({ error: "WhatsApp API error", detail: err }, { status: 500 })
    }

    const waData = await waRes.json()
    const messageId = waData.messages?.[0]?.id

    // 2. Registrar actividad en CRM
    if (lead_id) {
      const client = await pool.connect()
      try {
        // Guardar actividad
        await client.query(
          `INSERT INTO activities (lead_id, type, title, description, is_automated)
           VALUES ($1, 'whatsapp_sent', $2, $3, false)`,
          [lead_id, `WhatsApp enviado por ${agent_name || "Asesor"}`, message]
        )

        // Guardar en tabla de mensajes si existe conversación
        const conv = await client.query(
          "SELECT id FROM conversations WHERE lead_id = $1 LIMIT 1",
          [lead_id]
        )
        if (conv.rows.length > 0) {
          await client.query(
            `INSERT INTO messages (conversation_id, whatsapp_message_id, direction, message_type, content, status)
             VALUES ($1, $2, 'outbound', 'text', $3, 'sent')
             ON CONFLICT (whatsapp_message_id) DO NOTHING`,
            [conv.rows[0].id, messageId || `crm-${Date.now()}`, message]
          )
          await client.query(
            "UPDATE conversations SET last_message_at = NOW() WHERE id = $1",
            [conv.rows[0].id]
          )
        }
      } finally {
        client.release()
      }
    }

    return NextResponse.json({ success: true, message_id: messageId })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Error /api/whatsapp/send:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
