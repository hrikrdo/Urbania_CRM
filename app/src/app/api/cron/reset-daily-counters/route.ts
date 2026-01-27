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

    // Call the reset_daily_lead_counters function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("reset_daily_lead_counters")

    if (error) {
      console.error("Error resetting counters:", error)
      return NextResponse.json(
        { error: "Failed to reset counters", details: error.message },
        { status: 500 }
      )
    }

    console.log("Daily lead counters reset successfully")

    return NextResponse.json({
      success: true,
      message: "Daily lead counters reset successfully",
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
