// Google Calendar API integration
// Uses the access token obtained via Firebase Google Sign-In with Calendar scope

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export async function fetchGoogleCalendarEvents(accessToken, daysAhead = 30) {
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + daysAhead * 86400000).toISOString()

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error('Erreur Google Calendar: ' + res.status)
  const data = await res.json()
  return data.items || []
}

export async function createGoogleCalendarEvent(accessToken, event) {
  const body = {
    summary: event.title,
    location: event.location || '',
    start: event.startTime
      ? { dateTime: `${event.startDate}T${event.startTime}:00`, timeZone: 'Europe/Paris' }
      : { date: event.startDate },
    end: event.endTime
      ? { dateTime: `${event.endDate || event.startDate}T${event.endTime}:00`, timeZone: 'Europe/Paris' }
      : { date: event.endDate || event.startDate }
  }

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error('Erreur création événement Google: ' + res.status)
  return res.json()
}

export function convertGoogleEventToLocal(gEvent) {
  const start = gEvent.start?.dateTime || gEvent.start?.date || ''
  const end = gEvent.end?.dateTime || gEvent.end?.date || ''

  const startDate = start.substring(0, 10)
  const startTime = start.length > 10 ? start.substring(11, 16) : ''
  const endDate = end.substring(0, 10)
  const endTime = end.length > 10 ? end.substring(11, 16) : ''

  return {
    title: gEvent.summary || 'Sans titre',
    startDate,
    startTime,
    endDate,
    endTime,
    location: gEvent.location || '',
    category: 'perso',
    googleEventId: gEvent.id,
    fromGoogle: true
  }
}
