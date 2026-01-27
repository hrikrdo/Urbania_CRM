import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client for cron job (uses service role key)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // If CRON_SECRET is set, verify the request
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()

    // Call the expire_unattended_leads function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("expire_unattended_leads")

    if (error) {
      console.error("Error expiring leads:", error)
      return NextResponse.json(
        { error: "Failed to expire leads", details: error.message },
        { status: 500 }
      )
    }

    const expiredCount = data || 0

    console.log(`Expired ${expiredCount} unattended leads`)

    return NextResponse.json({
      success: true,
      message: `Expired ${expiredCount} unattended lead(s)`,
      expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}
