import { useState, useCallback } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../lib/firebase'
import OpenAI from 'openai'

const TOKEN_KEY = 'google_gmail_token'
const TOKEN_EXPIRY_KEY = 'google_gmail_token_expiry'

// Multiple search patterns to maximise chances of finding the emails
const SEARCH_QUERIES = [
  'from:nepasrepondre@notification.cemp.caisse-epargne.fr',
  'from:caisse-epargne.fr paiement',
  'from:cemp.caisse-epargne.fr',
  'paiement carte caisse epargne',
  'nepasrepondre notification cemp',
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
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return ''
  }
}

function extractEmailText(payload) {
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractEmailText(part)
      if (text) return text
    }
  }
  if (payload.mimeType === 'text/plain' && payload.body?.data) return decodeBase64(payload.body.data)
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  }
  return ''
}

async function parseExpensesWithAI(emailTexts) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Clé OpenAI non configurée')
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const combined = emailTexts.slice(0, 15).map((t, i) => `--- Email ${i + 1} ---\n${t.slice(0, 1000)}`).join('\n\n')

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Voici des emails de notification bancaire (Caisse d'Épargne ou autre banque). Extrais chaque dépense par carte.
Pour chaque dépense, donne : montant (nombre décimal), description (enseigne/commerce), date (YYYY-MM-DD), catégorie parmi: courses, resto, maison, loisirs, santé, autre.

Réponds UNIQUEMENT avec ce JSON:
{
  "expenses": [
    { "amount": 42.50, "description": "Carrefour", "date": "2024-01-15", "category": "courses" }
  ]
}

Si aucune dépense trouvée, réponds: { "expenses": [] }

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
    // Always re-auth to ensure we have a fresh Gmail token
    const token = await connect()

    setLoading(true)
    setError(null)
    try {
      const after = Math.floor((Date.now() - daysBack * 86400000) / 1000)
      const seenIds = new Set()
      const allMessageIds = []

      // Try each search pattern until we find emails
      for (const q of SEARCH_QUERIES) {
        const query = encodeURIComponent(`${q} after:${after}`)
        try {
          const search = await gmailFetch(token, `messages?q=${query}&maxResults=30`)
          const msgs = search.messages || []
          for (const m of msgs) {
            if (!seenIds.has(m.id)) {
              seenIds.add(m.id)
              allMessageIds.push(m)
            }
          }
          if (allMessageIds.length > 0) break // found some, stop searching
        } catch {
          // try next query
        }
      }

      // If still nothing, try without date filter on the first query
      if (allMessageIds.length === 0) {
        for (const q of SEARCH_QUERIES.slice(0, 3)) {
          try {
            const search = await gmailFetch(token, `messages?q=${encodeURIComponent(q)}&maxResults=15`)
            const msgs = search.messages || []
            for (const m of msgs) {
              if (!seenIds.has(m.id)) { seenIds.add(m.id); allMessageIds.push(m) }
            }
            if (allMessageIds.length > 0) break
          } catch {
            // try next
          }
        }
      }

      if (allMessageIds.length === 0) {
        throw new Error(`Aucun email bancaire trouvé. Vérifie que les emails de la Caisse d'Épargne sont dans ta boîte Gmail (expéditeur: nepasrepondre@notification.cemp.caisse-epargne.fr)`)
      }

      const emailTexts = await Promise.all(
        allMessageIds.map(async ({ id }) => {
          const msg = await gmailFetch(token, `messages/${id}?format=full`)
          return extractEmailText(msg.payload)
        })
      )

      const validTexts = emailTexts.filter(t => t.length > 10)
      if (validTexts.length === 0) {
        throw new Error('Emails trouvés mais contenu vide — format non supporté')
      }

      return await parseExpensesWithAI(validTexts)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [connect])

  return { connected: !!accessToken, loading, error, connect, fetchExpenses }
}
