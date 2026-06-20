import { useState, useCallback } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../lib/firebase'
import OpenAI from 'openai'

const TOKEN_KEY = 'google_gmail_token'
const TOKEN_EXPIRY_KEY = 'google_gmail_token_expiry'

const SEARCH_QUERIES = [
  'from:nepasrepondre@notification.cemp.caisse-epargne.fr',
  'from:caisse-epargne',
  '"paiement par carte" "validé"',
  '"Votre paiement par carte"',
  'caisse epargne paiement carte',
]

function getSavedToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  return token
}

async function gmailFetch(token, path) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gmail API ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

function decodeBase64(str) {
  try {
    // URL-safe base64 → standard base64
    const standard = str.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(standard)
    // Handle UTF-8 encoding
    return decodeURIComponent(escape(decoded))
  } catch {
    try { return atob(str.replace(/-/g, '+').replace(/_/g, '/')) } catch { return '' }
  }
}

function extractAllText(part, depth = 0) {
  if (depth > 8) return ''
  const texts = []

  if (part.body?.data) {
    texts.push(decodeBase64(part.body.data))
  }

  if (part.parts) {
    for (const child of part.parts) {
      texts.push(extractAllText(child, depth + 1))
    }
  }

  return texts.join('\n')
}

function extractEmailText(msg) {
  // Use snippet as a reliable fallback (Google extracts it)
  const snippet = msg.snippet || ''

  const payload = msg.payload
  if (!payload) return snippet

  // Try to get the best text representation
  const rawText = extractAllText(payload)

  // Strip HTML tags if present
  const cleaned = rawText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{3,}/g, ' ')
    .trim()

  // Return the richest content, or fall back to snippet
  if (cleaned.length > 50) return cleaned
  if (rawText.length > 50) return rawText
  return snippet
}

function buildEmailSummary(msg) {
  const headers = msg.payload?.headers || []
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  const from = headers.find(h => h.name === 'From')?.value || ''
  const date = headers.find(h => h.name === 'Date')?.value || ''
  const body = extractEmailText(msg)

  return `Sujet: ${subject}\nDe: ${from}\nDate: ${date}\nContenu: ${body.slice(0, 1200)}`
}

async function parseExpensesWithAI(emailSummaries) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Clé OpenAI non configurée')
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const combined = emailSummaries.slice(0, 20).map((t, i) => `--- Email ${i + 1} ---\n${t}`).join('\n\n')

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Voici des emails de la Caisse d'Épargne (ou autre banque). Certains ont le sujet "Votre paiement par carte a été validé" ou "Un paiement par carte a été validé".

Extrais TOUTES les dépenses par carte que tu trouves (montant, commerce, date).
Catégorie parmi: courses, resto, maison, loisirs, santé, transport, autre.

Réponds UNIQUEMENT avec ce JSON (expenses peut être vide si vraiment rien trouvé):
{
  "expenses": [
    { "amount": 42.50, "description": "Carrefour", "date": "2024-01-15", "category": "courses" }
  ]
}

Emails:
${combined}`
    }],
    response_format: { type: 'json_object' }
  })

  const data = JSON.parse(res.choices[0].message.content)
  return data.expenses || []
}

export function useGmailExpenses() {
  const [accessToken, setAccessToken] = useState(getSavedToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const connect = useCallback(async () => {
    setLoading(true)
    setError(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly')
      provider.setCustomParameters({ prompt: 'consent' })
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential.accessToken
      if (!token) throw new Error('Pas de token Gmail — réessaye')
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + 3600 * 1000).toString())
      setAccessToken(token)
      return token
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExpenses = useCallback(async (daysBack = 90) => {
    const token = await connect()

    setLoading(true)
    setError(null)
    try {
      const after = Math.floor((Date.now() - daysBack * 86400000) / 1000)
      const seenIds = new Set()
      const allMessageIds = []

      for (const q of SEARCH_QUERIES) {
        const query = encodeURIComponent(`${q} after:${after}`)
        try {
          const search = await gmailFetch(token, `messages?q=${query}&maxResults=30`)
          for (const m of (search.messages || [])) {
            if (!seenIds.has(m.id)) { seenIds.add(m.id); allMessageIds.push(m) }
          }
          if (allMessageIds.length >= 5) break
        } catch { /* try next */ }
      }

      // Fallback: no date filter
      if (allMessageIds.length === 0) {
        for (const q of SEARCH_QUERIES.slice(0, 3)) {
          try {
            const search = await gmailFetch(token, `messages?q=${encodeURIComponent(q)}&maxResults=20`)
            for (const m of (search.messages || [])) {
              if (!seenIds.has(m.id)) { seenIds.add(m.id); allMessageIds.push(m) }
            }
            if (allMessageIds.length >= 3) break
          } catch { /* try next */ }
        }
      }

      if (allMessageIds.length === 0) {
        throw new Error('Aucun email bancaire trouvé dans Gmail. Vérifie que tu es connecté avec le bon compte Google.')
      }

      // Fetch full message content including snippet
      const messages = await Promise.all(
        allMessageIds.slice(0, 20).map(({ id }) =>
          gmailFetch(token, `messages/${id}?format=full`)
        )
      )

      const emailSummaries = messages.map(buildEmailSummary).filter(t => t.length > 30)

      if (emailSummaries.length === 0) {
        throw new Error('Emails trouvés mais impossible de lire le contenu.')
      }

      return await parseExpensesWithAI(emailSummaries)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [connect])

  return { connected: !!accessToken, loading, error, connect, fetchExpenses }
}
