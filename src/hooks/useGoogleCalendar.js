import { useState, useCallback } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { GoogleAuthProvider } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent, convertGoogleEventToLocal } from '../lib/googleCalendar'

const TOKEN_KEY = 'google_calendar_token'
const TOKEN_EXPIRY_KEY = 'google_calendar_token_expiry'

function getSavedToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > parseInt(expiry)) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_EXPIRY_KEY); return null }
  return token
}

export function useGoogleCalendar() {
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
      const expiry = Date.now() + 3600 * 1000 // 1h
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString())
      setAccessToken(token)
      return token
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    setAccessToken(null)
  }, [])

  const getEvents = useCallback(async (daysAhead = 30) => {
    let token = accessToken
    if (!token) token = await connect()
    return fetchGoogleCalendarEvents(token, daysAhead)
  }, [accessToken, connect])

  const createEvent = useCallback(async (event) => {
    let token = accessToken
    if (!token) token = await connect()
    return createGoogleCalendarEvent(token, event)
  }, [accessToken, connect])

  return { connected: !!accessToken, loading, error, connect, disconnect, getEvents, createEvent, convertGoogleEventToLocal }
}
