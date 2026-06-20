import { useState, useCallback } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import OpenAI from 'openai'

const TOKEN_KEY = 'google_gmail_token'
const TOKEN_EXPIRY_KEY = 'google_gmail_token_expiry'
const SENDER = 'nepasrepondre@notification.cemp.caisse-epargne.fr'

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
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`)
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
  if (payload.body?.data) return decodeBase64(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeBase64(part.body.data)
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      }
    }
  }
  return ''
}

async function parseExpensesWithAI(emailTexts) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Clé OpenAI non configurée')
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const combined = emailTexts.slice(0, 10).map((t, i) => `--- Email ${i + 1} ---\n${t.slice(0, 800)}`).join('\n\n')

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Voici des emails de notification bancaire de la Caisse d'Épargne. Extrais chaque dépense (paiement par carte).
Pour chaque dépense, donne : montant (nombre), description (enseigne/commerce), date (YYYY-MM-DD), catégorie parmi: courses, resto, maison, loisirs, santé, autre.
Ignore les virements, remboursements, retraits ATM si peu clairs.

Réponds UNIQUEMENT avec ce JSON:
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
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential.accessToken
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

  const fetchExpenses = useCallback(async (daysBack = 30) => {
    let token = accessToken
    if (!token) token = await connect()

    setLoading(true)
    setError(null)
    try {
      const after = Math.floor((Date.now() - daysBack * 86400000) / 1000)
      const search = await gmailFetch(token, `messages?q=from:${SENDER} after:${after}&maxResults=20`)
      const messageIds = search.messages || []

      if (messageIds.length === 0) return []

      const emailTexts = await Promise.all(
        messageIds.map(async ({ id }) => {
          const msg = await gmailFetch(token, `messages/${id}`)
          return extractEmailText(msg.payload)
        })
      )

      return await parseExpensesWithAI(emailTexts.filter(t => t.length > 20))
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [accessToken, connect])

  return { connected: !!accessToken, loading, error, connect, fetchExpenses }
}
