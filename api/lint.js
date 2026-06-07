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

Perform two analyses:

## ANALYSIS 1 — INTENT CLASSIFICATION
Classify the primary intent of the message using exactly one of these labels:

- CRITICAL-ACTION — Requires immediate operational execution within an SLA window
- FEEDBACK-ONLY — Constructive performance or design commentary; does not block progress
- QUESTION-ONLY — Seeking non-blocking clarification or background context
- SUGGESTION — Optional optimization; left to the owner's discretion
- APPROVAL-REQUEST — Seeking sign-off, green light, or formal endorsement
- ESCALATION — Flagging a risk, blocker, or issue to a higher authority
- STATUS-UPDATE — Informational progress report; no action required from recipient
- FOLLOW-UP — Chasing a previous request or pending item

Pick the single best fit. Also write one short sentence (max 12 words) explaining why.

## ANALYSIS 2 — CULTURAL LINT
Using Erin Meyer's eight cultural dimensions — Communicating, Evaluating, Persuading, Leading, Deciding, Trusting, Disagreeing, Scheduling — analyse for cultural mismatches between ${senderNationality} (sender) and ${recipientNationality} (recipient).

Rules:
- Maximum 2 flags, most important only
- Each issue: one short sentence, max 15 words
- Each suggestion: one short sentence, max 15 words
- Rewrite: concise, same length as original message
- No markdown, no extra text outside JSON

Return ONLY this JSON object:
{
  "intent": {
    "label": "LABEL_HERE",
    "reason": "One short sentence explaining the classification"
  },
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
          maxOutputTokens: 2048,
        }
      })
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      throw new Error(`Gemini error: ${err}`)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!rawText) throw new Error('Empty response from Gemini')

    // Strip markdown fences
    let clean = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()

    // Extract JSON object between first { and last }
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) throw new Error('Invalid response format from Gemini')
    clean = clean.substring(firstBrace, lastBrace + 1)

    const parsed = JSON.parse(clean)
    return res.status(200).json(parsed)

  } catch (e) {
    if (e.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    console.error('lint error:', e)
    res.status(500).json({ error: e.message })
  }
}