import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw new Error('Unauthorized')

  try {
    // Use authenticateRequest instead of verifyToken — works across all origins
    const requestState = await clerk.authenticateRequest(req, {
      jwtKey: process.env.CLERK_JWT_KEY,
      authorizedParties: [
        'https://culture-lint.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
    })

    if (!requestState.isSignedIn) throw new Error('Unauthorized')
    return requestState.toAuth()
  } catch (e) {
    // Fallback — try decoding token manually
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
    } catch (e2) {
      console.error('Auth error:', e2.message)
      throw new Error('Unauthorized')
    }
  }
}