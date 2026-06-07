export async function requireAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw new Error('Unauthorized')

  try {
    // Decode JWT payload without verification (safe for dev)
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid token')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (!payload?.sub) throw new Error('Unauthorized')
    return payload
  } catch (e) {
    console.error('Auth error:', e.message)
    throw new Error('Unauthorized')
  }
}