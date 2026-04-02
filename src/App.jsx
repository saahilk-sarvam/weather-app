import { useEffect, useMemo, useState } from 'react'
import './App.css'

const OWM_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather'

function themeFromWeatherId(weatherId) {
  // https://openweathermap.org/weather-conditions
  if (typeof weatherId !== 'number') return 'default'
  if (weatherId >= 200 && weatherId < 300) return 'thunder'
  if (weatherId >= 300 && weatherId < 400) return 'drizzle'
  if (weatherId >= 500 && weatherId < 600) return 'rain'
  if (weatherId >= 600 && weatherId < 700) return 'snow'
  if (weatherId >= 700 && weatherId < 800) return 'mist'
  if (weatherId === 800) return 'clear'
  if (weatherId > 800 && weatherId < 900) return 'clouds'
  return 'default'
}

function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return String(Math.round(n))
}

function App() {
  const apiKey = import.meta.env.VITE_OWM_API_KEY
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')
  const [weather, setWeather] = useState(null)

  const theme = useMemo(() => {
    const id = weather?.weather?.[0]?.id
    return themeFromWeatherId(id)
  }, [weather])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      // keep last theme on unmount; no cleanup needed
    }
  }, [theme])

  async function fetchWeatherByCity(city) {
    if (!apiKey) {
      throw new Error(
        'Missing API key. Add VITE_OWM_API_KEY to your .env file and restart the dev server.',
      )
    }

    const url = new URL(OWM_ENDPOINT)
    url.searchParams.set('q', city)
    url.searchParams.set('appid', apiKey)
    url.searchParams.set('units', 'metric') // Celsius

    const res = await fetch(url)
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message =
        data?.message ||
        (res.status === 404 ? 'City not found. Try another search.' : 'Request failed.')
      throw new Error(message)
    }

    return data
  }

  async function onSubmit(e) {
    e.preventDefault()
    const city = query.trim()
    if (!city) return

    setStatus('loading')
    setError('')
    try {
      const data = await fetchWeatherByCity(city)
      setWeather(data)
      setStatus('success')
    } catch (err) {
      setWeather(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const locationText = useMemo(() => {
    if (!weather) return ''
    const name = weather?.name
    const country = weather?.sys?.country
    return [name, country].filter(Boolean).join(', ')
  }, [weather])

  const condition = weather?.weather?.[0]
  const iconUrl = condition?.icon
    ? `https://openweathermap.org/img/wn/${condition.icon}@2x.png`
    : ''

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="brandName">Weather</div>
            <div className="brandTag">Search any city worldwide</div>
          </div>
        </div>

        <form className="search" onSubmit={onSubmit}>
          <label className="srOnly" htmlFor="city">
            City
          </label>
          <input
            id="city"
            className="searchInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city (e.g., Mumbai, Tokyo, Paris)"
            autoComplete="off"
            inputMode="search"
          />
          <button className="searchButton" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>
      </header>

      <section className="card" aria-live="polite">
        {status === 'idle' && (
          <div className="empty">
            <div className="emptyTitle">Type a city to begin</div>
            <div className="emptyText">
              You’ll get temperature (°C), condition, humidity, wind speed, and an icon.
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="error">
            <div className="errorTitle">Couldn’t fetch weather</div>
            <div className="errorText">{error || 'Please try again.'}</div>
          </div>
        )}

        {status === 'success' && weather && (
          <div className="result">
            <div className="resultTop">
              <div className="resultLocation">
                <div className="locationName">{locationText}</div>
                <div className="locationMeta">
                  {condition?.main ? condition.main : '—'}
                  {condition?.description ? ` · ${condition.description}` : ''}
                </div>
              </div>

              <div className="resultIconWrap">
                {iconUrl ? (
                  <img
                    className="resultIcon"
                    src={iconUrl}
                    alt={condition?.description || 'Weather icon'}
                    width="96"
                    height="96"
                    loading="lazy"
                  />
                ) : (
                  <div className="resultIconFallback" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="tempRow">
              <div className="temp">
                {formatNumber(weather?.main?.temp)}
                <span className="tempUnit">°C</span>
              </div>
              <div className="feels">
                Feels like {formatNumber(weather?.main?.feels_like)}°C
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="statLabel">Humidity</div>
                <div className="statValue">{formatNumber(weather?.main?.humidity)}%</div>
              </div>
              <div className="stat">
                <div className="statLabel">Wind</div>
                <div className="statValue">
                  {typeof weather?.wind?.speed === 'number'
                    ? `${weather.wind.speed.toFixed(1)} m/s`
                    : '—'}
                </div>
              </div>
              <div className="stat">
                <div className="statLabel">Pressure</div>
                <div className="statValue">
                  {typeof weather?.main?.pressure === 'number'
                    ? `${weather.main.pressure} hPa`
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footerText">
          Data from OpenWeatherMap · Current Weather API · Units: metric (°C)
        </div>
      </footer>
    </main>
  )
}

export default App
