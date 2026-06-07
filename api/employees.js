import { getDb, initDb } from './_db.js'
import { requireAuth } from './_auth.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    await initDb()
    const sql = getDb()

    // Extract ID from URL
    const url = req.url.split('?')[0]
    const parts = url.split('/')
    const lastPart = parts[parts.length - 1]
    const id = (lastPart && lastPart !== 'employees') ? lastPart : null

    const method = req.method.toUpperCase()

    console.log('Request:', method, url, 'id:', id)

    if (method === 'GET' && !id) {
      const rows = await sql`SELECT * FROM employees ORDER BY created_at DESC`
      return res.status(200).json(rows)
    }

    if (method === 'POST' && !id) {
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

    if (method === 'PUT' && id) {
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

    if (method === 'DELETE' && id) {
      const result = await sql`
        DELETE FROM employees WHERE id = ${id} RETURNING id
      `
      if (result.length === 0) {
        return res.status(404).json({ error: 'Employee not found' })
      }
      return res.status(200).json({ success: true })
    }

    // Debug — tell us what we got
    return res.status(405).json({ 
      error: 'Method not allowed',
      debug: { method, url, id, parts }
    })

  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error('employees error:', e)
    res.status(500).json({ error: e.message })
  }
}