import { getDb, initDb } from './_db.js'
import { requireAuth } from './_auth.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    await initDb()
    const sql = getDb()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM employees ORDER BY created_at DESC`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { employee_id, name, nationality } = req.body
      if (!employee_id || !name || !nationality) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const [row] = await sql`
        INSERT INTO employees (employee_id, name, nationality)
        VALUES (${employee_id}, ${name}, ${nationality})
        RETURNING *
      `
      return res.status(201).json(row)
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
