import { useState, useEffect } from 'react'

function getWeatherIcon(code) {
  if (code === 0) return { icon: '☀️', label: 'Ensoleillé', outdoor: true }
  if (code <= 2) return { icon: '🌤️', label: 'Partiellement nuageux', outdoor: true }
  if (code <= 3) return { icon: '☁️', label: 'Nuageux', outdoor: true }
  if (code <= 49) return { icon: '🌫️', label: 'Brouillard', outdoor: false }
  if (code <= 59) return { icon: '🌦️', label: 'Bruine', outdoor: false }
  if (code <= 69) return { icon: '🌧️', label: 'Pluie', outdoor: false }
  if (code <= 79) return { icon: '❄️', label: 'Neige', outdoor: false }
  if (code <= 82) return { icon: '🌧️', label: 'Averses', outdoor: false }
  if (code <= 86) return { icon: '🌨️', label: 'Averses de neige', outdoor: false }
  if (code <= 99) return { icon: '⛈️', label: 'Orage', outdoor: false }
  return { icon: '🌡️', label: 'Inconnu', outdoor: true }
}

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('weather')
    if (cached) {
      setWeather(JSON.parse(cached))
      setLoading(false)
      return
    }

    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
          const res = await fetch(url)
          const data = await res.json()
          const current = data.current
          const daily = data.daily
          const info = getWeatherIcon(current.weathercode)
          const result = {
            temp: Math.round(current.temperature_2m),
            tempMax: Math.round(daily.temperature_2m_max[0]),
            tempMin: Math.round(daily.temperature_2m_min[0]),
            rain: daily.precipitation_probability_max[0],
            wind: Math.round(current.windspeed_10m),
            ...info,
          }
          sessionStorage.setItem('weather', JSON.stringify(result))
          setWeather(result)
        } catch {
          setError('Météo indisponible')
        } finally {
          setLoading(false)
        }
      },
      () => { setError('Localisation refusée'); setLoading(false) },
      { timeout: 5000 }
    )
  }, [])

  return { weather, loading, error }
}
