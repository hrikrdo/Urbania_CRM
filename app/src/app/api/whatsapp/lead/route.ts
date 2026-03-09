import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(sql: string, params: unknown[] = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res.rows
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      phone, first_name, last_name, email, cedula, income,
      project_interest, budget, timeframe, intent, score,
      conversation_url, chatwoot_conversation_id, conversation_history,
      ai_summary,
    } = body

    if (!phone) return NextResponse.json({ error: "phone es requerido" }, { status: 400 })

    const cleanPhone = phone.startsWith("+") ? phone : `+${phone}`

    // ── 1. Buscar status IDs ─────────────────────────────────────────
    const statuses = await query("SELECT id, slug FROM lead_statuses")
    const statusMap: Record<string, string> = {}
    for (const s of statuses) statusMap[s.slug] = s.id

    // ── 2. Buscar proyecto ───────────────────────────────────────────
    let projectId: string | null = null
    if (project_interest) {
      const proj = await query(
        "SELECT id FROM projects WHERE name ILIKE $1 LIMIT 1",
        [`%${project_interest}%`]
      )
      if (proj.length > 0) projectId = proj[0].id
    }

    // ── 2b. Presupuesto desde income si no hay budget explícito ────────
    const effectiveBudget = budget || income  // usar income como presupuesto si no hay otro valor

    // ── 3. Buscar lead existente ─────────────────────────────────────
    const existing = await query("SELECT id, cedula FROM leads WHERE phone = $1", [cleanPhone])
    let leadId: string
    let movedToPrecal = false
    const hasCedula = cedula && cedula.trim().length > 0

    if (existing.length > 0) {
      leadId = existing[0].id
      const yaTeníaCedula = !!existing[0].cedula

      // Determinar nuevo status si llega cédula por primera vez
      let newStatusId = null
      if (hasCedula && !yaTeníaCedula) {
        newStatusId = statusMap["precalificacion"]
        movedToPrecal = true
      }

      // Calcular presupuesto desde income o budget
      let budgetMin = null
      if (effectiveBudget) {
        const num = parseFloat(String(effectiveBudget).replace(/[^0-9.]/g, ""))
        if (!isNaN(num) && num > 100) budgetMin = num
      }

      // Temperatura: si tiene cédula = hot siempre
      const newTemp = hasCedula ? "hot" : (score === "hot" ? "hot" : score === "warm" ? "warm" : null)

      await query(`
        UPDATE leads SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE(NULLIF($2,''), last_name),
          email = COALESCE(NULLIF($3,''), email),
          cedula = COALESCE(NULLIF($4,''), cedula),
          project_id = COALESCE($5, project_id),
          budget_min = COALESCE($6, budget_min),
          status_id = COALESCE($7, status_id),
          temperature = COALESCE($8, temperature),
          last_contact_at = NOW(),
          last_response_at = NOW(),
          chat_attempts = chat_attempts + 1,
          notes = COALESCE($9, notes),
          updated_at = NOW()
        WHERE id = $10
      `, [first_name, last_name, email, cedula, projectId, budgetMin, newStatusId, newTemp,
          ai_summary || null, leadId])

    } else {
      // Crear nuevo lead
      if (!first_name) return NextResponse.json({ error: "first_name requerido" }, { status: 400 })

      // Status inicial
      let initialStatus = statusMap["lead_entrante"]
      if (hasCedula) { initialStatus = statusMap["precalificacion"]; movedToPrecal = true }
      else if (score === "hot") initialStatus = statusMap["contactado"]
      else if (score === "warm") initialStatus = statusMap["en_conversacion"]

      let budgetMin = null
      if (effectiveBudget) {
        const num = parseFloat(String(effectiveBudget).replace(/[^0-9.]/g, ""))
        if (!isNaN(num) && num > 100) budgetMin = num
      }

      // Si tiene cédula = hot (alto interés confirmado)
      const initTemp = hasCedula ? "hot" : (score === "hot" ? "hot" : score === "warm" ? "warm" : "cold")

      const notesExtra = [
        income && `Ingreso familiar: $${income}/mes`,
        timeframe && `Plazo: ${timeframe}`,
        intent && `Intención: ${intent === "invest" ? "Inversión" : "Vivienda propia"}`,
      ].filter(Boolean).join(" | ")

      const rows = await query(`
        INSERT INTO leads (
          first_name, last_name, phone, email, cedula, source,
          status_id, project_id, budget_min,
          temperature, notes, last_contact_at, last_response_at, chat_attempts
        ) VALUES ($1,$2,$3,$4,$5,'whatsapp_bot',$6,$7,$8,$9,$10,NOW(),1)
        RETURNING id
      `, [
        first_name, last_name || null, cleanPhone, email || null, cedula || null,
        initialStatus, projectId, budgetMin,
        initTemp, ai_summary || notesExtra || null
      ])
      leadId = rows[0].id
    }

    // ── 4. Conversación y mensajes ────────────────────────────────────
    let convDbId: string | null = null
    const convRows = await query(
      "SELECT id FROM conversations WHERE phone_number = $1", [cleanPhone]
    )
    if (convRows.length > 0) {
      convDbId = convRows[0].id
      await query(
        "UPDATE conversations SET lead_id=$1, last_message_at=NOW(), whatsapp_conversation_id=COALESCE($2,whatsapp_conversation_id) WHERE id=$3",
        [leadId, chatwoot_conversation_id ? String(chatwoot_conversation_id) : null, convDbId]
      )
    } else {
      const newConv = await query(`
        INSERT INTO conversations (lead_id, phone_number, whatsapp_conversation_id, status, last_message_at)
        VALUES ($1,$2,$3,'active',NOW()) RETURNING id
      `, [leadId, cleanPhone, chatwoot_conversation_id ? String(chatwoot_conversation_id) : null])
      convDbId = newConv[0].id
    }

    // ── 5. Guardar mensajes del historial ────────────────────────────
    if (convDbId && conversation_history?.length > 0) {
      for (const msg of conversation_history as { role: string; content: string; id?: string }[]) {
        if (msg.id) {
          const dup = await query("SELECT id FROM messages WHERE whatsapp_message_id=$1", [msg.id])
          if (dup.length > 0) continue
        }
        await query(`
          INSERT INTO messages (conversation_id, whatsapp_message_id, direction, message_type, content, status)
          VALUES ($1,$2,$3,'text',$4,'delivered')
          ON CONFLICT (whatsapp_message_id) DO NOTHING
        `, [convDbId, msg.id || null, msg.role === "user" ? "inbound" : "outbound", msg.content])
      }
    }

    // ── 6. Registrar actividades de WhatsApp ──────────────────────────
    // Guardar cada mensaje del historial como actividad visible en el CRM
    if (conversation_history?.length > 0) {
      for (const msg of conversation_history as { role: string; content: string; id?: string }[]) {
        const actType = msg.role === "user" ? "whatsapp_received" : "whatsapp_sent"
        const title = msg.role === "user" ? "Mensaje de WhatsApp" : "Respuesta de Valeria (Bot)"
        await query(
          "INSERT INTO activities (lead_id, type, title, description, is_automated) VALUES ($1,$2,$3,$4,$5)",
          [leadId, actType, title, msg.content, msg.role === "assistant"]
        )
      }
    }

    // Actividad de sistema: resumen de la interacción
    const actDesc = [
      `Bot Valeria — Score: ${score || "en gestión"}`,
      movedToPrecal ? "✅ Cédula recibida → movido a Precalificación" : null,
      project_interest ? `Proyecto de interés: ${project_interest}` : null,
      income ? `Ingreso declarado: $${income}/mes` : null,
      conversation_url ? `Ver chat: ${conversation_url}` : null,
    ].filter(Boolean).join(" | ")

    await query(
      "INSERT INTO activities (lead_id, type, title, description, is_automated) VALUES ($1,'system_notification',$2,$3,true)",
      [leadId, "Actualización por WhatsApp Bot", actDesc]
    )
    
    // Si movió a precalificación, registrar el cambio de estado
    if (movedToPrecal) {
      await query(
        "INSERT INTO activities (lead_id, type, title, description, is_automated) VALUES ($1,'status_changed','Etapa actualizada','Lead movido a Precalificación — cédula recibida vía WhatsApp Bot',true)",
        [leadId]
      )
    }

    // ── 7. Respuesta ──────────────────────────────────────────────────
    const finalLead = await query(
      "SELECT id, first_name, last_name, phone, email, cedula, temperature FROM leads WHERE id=$1",
      [leadId]
    )

    return NextResponse.json({
      success: true,
      lead: finalLead[0],
      action: existing.length > 0 ? "updated" : "created",
      moved_to_precalificacion: movedToPrecal,
    }, { status: existing.length > 0 ? 200 : 201 })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error("Error /api/whatsapp/lead:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "whatsapp-lead" })
}
