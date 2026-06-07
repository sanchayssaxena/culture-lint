import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw new Error('Unauthorized')

  const payload = await clerk.verifyToken(token)
  if (!payload?.sub) throw new Error('Unauthorized')
  return payload
}
