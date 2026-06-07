import { getDb, initDb } from './_db.js'
import { requireAuth } from './_auth.js'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

// Returns the logged-in user's own employee record
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const payload = await requireAuth(req)
    await initDb()
    const sql = getDb()

    const userId = payload.sub
    const clerkUser = await clerk.users.getUser(userId)
    const employeeId = `USR-${userId.slice(-6).toUpperCase()}`

    const [row] = await sql`
      SELECT * FROM employees WHERE employee_id = ${employeeId} LIMIT 1
    `

    return res.status(200).json({
      employeeId,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      nationality: clerkUser.publicMetadata?.nationality || null,
      dbRow: row || null,
    })
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
