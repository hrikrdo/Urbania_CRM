// Temporary script to seed pool data for testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sssupabase.hrikrdo.com'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.zIXe4Bvg8MLgbAcBeKFyG0aS6JjIEkKoeUhiX-x_z0Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('Starting seed process...')

  // 1. Get existing projects
  let { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .limit(3)

  if (projectsError) {
    console.error('Error fetching projects:', projectsError)
    return
  }

  console.log('Existing projects:', projects)

  // 2. Get ALL pool leads (unassigned) - order by created_at to get consistent results
  const { data: poolLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .is('assigned_to', null)
    .order('created_at', { ascending: true })

  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return
  }

  console.log('Pool leads found:', poolLeads?.length)
  console.log('Leads:', poolLeads?.map(l => `${l.first_name} ${l.last_name}`))

  // 3. Update ALL pool leads with projects and varied attention_deadlines
  if (poolLeads && poolLeads.length > 0 && projects && projects.length > 0) {
    const now = new Date()
    const totalLeads = poolLeads.length

    for (let i = 0; i < totalLeads; i++) {
      const lead = poolLeads[i]
      const project = projects[i % projects.length]

      // Distribute deadlines evenly:
      // - First third: 40-55 min remaining (green/fresh)
      // - Middle third: 10-25 min remaining (yellow/warning)
      // - Last third: expired (red/critical)
      let deadlineMinutes
      const third = Math.floor(totalLeads / 3)

      if (i < third) {
        // Green: 40-55 min remaining
        deadlineMinutes = 55 - (i * 5)
      } else if (i < third * 2) {
        // Yellow: 10-25 min remaining
        deadlineMinutes = 25 - ((i - third) * 5)
      } else {
        // Red: Already expired
        deadlineMinutes = -10 - ((i - third * 2) * 15)
      }

      const deadline = new Date(now.getTime() + deadlineMinutes * 60 * 1000)
      const poolEnteredAt = new Date(now.getTime() - (60 - deadlineMinutes) * 60 * 1000)

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          project_id: project.id,
          attention_deadline: deadline.toISOString(),
          attention_expired: deadlineMinutes <= 0,
          pool_entered_at: poolEnteredAt.toISOString()
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError)
      } else {
        const status = deadlineMinutes > 30 ? '🟢' : deadlineMinutes > 0 ? '🟡' : '🔴'
        console.log(`${status} Updated ${lead.first_name} ${lead.last_name}: ${project.name}, ${deadlineMinutes > 0 ? deadlineMinutes + ' min remaining' : 'EXPIRED'}`)
      }
    }
  }

  console.log('\nSeed process completed!')
  console.log('Refresh the pool page to see the changes.')
}

seedData().catch(console.error)
