import { getDb, initDb } from './_db.js'
import { requireAuth } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const payload = await requireAuth(req)
    await initDb()
    const sql = getDb()

    const { nationality, name, employeeId } = req.body
    if (!nationality || !name || !employeeId) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const clerkUserId = payload.sub

    // Remove any manually pre-added row with the same employee_id but no clerk_user_id
    // This handles the case where admin added John before John signed up
    await sql`
      DELETE FROM employees 
      WHERE employee_id = ${employeeId} 
      AND clerk_user_id IS NULL
    `

    // Upsert on clerk_user_id — prevents duplicates if user onboards multiple times
    await sql`
      INSERT INTO employees (employee_id, name, nationality, clerk_user_id)
      VALUES (${employeeId}, ${name}, ${nationality}, ${clerkUserId})
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET 
        employee_id = EXCLUDED.employee_id,
        name = EXCLUDED.name, 
        nationality = EXCLUDED.nationality
    `

    return res.status(200).json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error('onboard error:', e)
    res.status(500).json({ error: e.message })
  }
}