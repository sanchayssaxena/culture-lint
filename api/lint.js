import { requireAuth } from './_auth.js'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function buildPrompt(message, senderNationality, recipientNationality, recipientName) {
  return `You are an expert in cross-cultural business communication trained on Erin Meyer's Culture Map framework.

Sender's nationality: ${senderNationality}
Recipient's name: ${recipientName}
Recipient's nationality: ${recipientNationality}

Draft message to analyse:
"""
${message}
"""

Analyse this message for cultural mismatches using Erin Meyer's eight dimensions: Communicating, Evaluating, Persuading, Leading, Deciding, Trusting, Disagreeing, Scheduling.

Rules:
- Maximum 2 flags only, pick the most important ones
- Each issue: one short sentence (max 15 words)
- Each suggestion: one short sentence (max 15 words)
- Rewrite: keep it concise, same length as the original message
- No markdown, no extra text

Return ONLY this JSON:
{
  "risk": "high" or "medium" or "low",
  "flags": [
    {
      "dimension": "Dimension name",
      "issue": "Short issue sentence",
      "suggestion": "Short fix sentence"
    }
  ],
  "rewrite": "Concise culturally adapted message"
}`
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAuth(req)

    const { message, senderNationality, recipientNationality, recipientName } = req.body
    if (!message || !senderNationality || !recipientNationality) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const prompt = buildPrompt(message, senderNationality, recipientNationality, recipientName)

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        }
      })
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      throw new Error(`Gemini error: ${err}`)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log('Gemini raw response:', rawText) // debug log
    if (!rawText) {
  throw new Error('Empty response from Gemini')
}
    // Robustly strip markdown fences and clean the response
    let clean = rawText
  .replace(/```json\s*/gi, '')
  .replace(/```\s*/gi, '')
  .trim()

    // Extract just the JSON object between first { and last }
    const firstBrace = clean.indexOf('{')
const lastBrace = clean.lastIndexOf('}')

if (firstBrace === -1 || lastBrace === -1) {
  console.error('No JSON object found in:', clean)
  throw new Error('Invalid response format from Gemini')
}

clean = clean.substring(firstBrace, lastBrace + 1)
console.log('Cleaned JSON:', clean) // debug log

const parsed = JSON.parse(clean)
return res.status(200).json(parsed)

  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error('lint error:', e)
    res.status(500).json({ error: e.message })
  }
}