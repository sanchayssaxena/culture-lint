import { getDb, initDb } from './_db.js'
import { requireAuth } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const payload = await requireAuth(req)
    await initDb()
    const sql = getDb()

    const clerkUserId = payload.sub

    const [row] = await sql`
      SELECT * FROM employees WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `

    return res.status(200).json({
      employeeId: row?.employee_id || null,
      name: row?.name || null,
      nationality: row?.nationality || null,
    })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}