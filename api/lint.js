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

Using Erin Meyer's eight cultural dimensions — Communicating (low-context vs high-context), Evaluating (direct vs indirect negative feedback), Persuading (principles-first vs applications-first), Leading (egalitarian vs hierarchical), Deciding (consensual vs top-down), Trusting (task-based vs relationship-based), Disagreeing (confrontational vs avoids confrontation), and Scheduling (linear-time vs flexible-time) — analyse this message for cultural mismatches between the sender (${senderNationality}) and recipient (${recipientNationality}) cultures.

Return ONLY a valid JSON object with this exact structure (no markdown fences, no extra text):
{
  "risk": "high" | "medium" | "low",
  "flags": [
    {
      "dimension": "Name of the Meyer dimension",
      "issue": "One clear sentence describing the cultural friction",
      "suggestion": "One concrete sentence on how to fix it"
    }
  ],
  "rewrite": "A complete, culturally adapted rewrite of the message appropriate for ${recipientNationality} business culture"
}

Return 1–3 flags. If no issues exist, return risk "low" with one flag noting what works well, and a lightly polished rewrite.`
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
          maxOutputTokens: 1024,
        }
      })
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      throw new Error(`Gemini error: ${err}`)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip any accidental markdown fences
    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json(parsed)
  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error('lint error:', e)
    res.status(500).json({ error: e.message })
  }
}
