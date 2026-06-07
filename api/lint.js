import { requireAuth } from './_auth.js'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function buildPrompt(message, senderNationality, recipientNationality, recipientName) {
  return `You are an expert in cross-cultural business communication trained on Erin Meyer Culture Map framework.

Sender nationality: ${senderNationality}
Recipient name: ${recipientName}
Recipient nationality: ${recipientNationality}

Message to analyse:
${message}

TASK 1 - INTENT CLASSIFICATION
Pick exactly one intent label from this list:
CRITICAL-ACTION
FEEDBACK-ONLY
QUESTION-ONLY
SUGGESTION
APPROVAL-REQUEST
ESCALATION
STATUS-UPDATE
FOLLOW-UP

Write one short reason sentence (max 12 words) explaining your choice.

TASK 2 - CULTURAL LINT
Using Erin Meyer dimensions (Communicating, Evaluating, Persuading, Leading, Deciding, Trusting, Disagreeing, Scheduling), find cultural mismatches between ${senderNationality} sender and ${recipientNationality} recipient.
- Pick max 2 most important flags
- Each issue: max 15 words
- Each suggestion: max 15 words
- Rewrite: same length as original, culturally adapted for ${recipientNationality}

Respond with only this JSON, no other text:
{"intent":{"label":"INTENT_LABEL","reason":"reason sentence"},"risk":"RISK_LEVEL","flags":[{"dimension":"dimension name","issue":"issue sentence","suggestion":"suggestion sentence"}],"rewrite":"rewrite text"}

Replace INTENT_LABEL with one of the labels above.
Replace RISK_LEVEL with exactly one of: high, medium, low`
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
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
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

    let clean = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()

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