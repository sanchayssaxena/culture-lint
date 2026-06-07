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

    await sql`
      INSERT INTO employees (employee_id, name, nationality)
      VALUES (${employeeId}, ${name}, ${nationality})
      ON CONFLICT (employee_id)
      DO UPDATE SET name = EXCLUDED.name, nationality = EXCLUDED.nationality
    `

    return res.status(200).json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}