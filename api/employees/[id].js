import { getDb, initDb } from '../_db.js'
import { requireAuth } from '../_auth.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    await initDb()
    const sql = getDb()
    const id = req.query.id

    if (req.method === 'PUT') {
      const { employee_id, name, nationality } = req.body
      if (!employee_id || !name || !nationality) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const [row] = await sql`
        UPDATE employees
        SET employee_id = ${employee_id}, name = ${name}, nationality = ${nationality}
        WHERE id = ${id}
        RETURNING *
      `
      return res.status(200).json(row)
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM employees WHERE id = ${id}`
      return res.status(200).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
