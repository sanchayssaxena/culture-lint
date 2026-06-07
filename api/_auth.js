import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw new Error('Unauthorized')

  try {
    const payload = await clerk.verifyToken(token, {
      authorizedParties: [
        'https://culture-lint.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
    })
    if (!payload?.sub) throw new Error('Unauthorized')
    return payload
  } catch (e) {
    console.error('Auth error:', e.message)
    throw new Error('Unauthorized')
  }
}