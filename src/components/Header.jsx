import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { formatEyebrowDate, greetingPart, toISODate } from '../lib/dateUtils.js'
import { quoteOfDay } from '../lib/constants.js'

const ZONE_BY_MODE = {
  oregon: 'America/Los_Angeles',
  hawaii: 'Pacific/Honolulu',
}

function zoneAbbrev(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    const part = parts.find((p) => p.type === 'timeZoneName')
    return part ? part.value : ''
  } catch {
    return ''
  }
}

export default function Header() {
  const [mode, setMode] = useState('oregon')
  const [dueToday, setDueToday] = useState(0)
  const quote = quoteOfDay()

  useEffect(() => {
    fetch('/api/user/timezone')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.timezone_mode) setMode(data.timezone_mode === 'auto' ? 'oregon' : data.timezone_mode)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const today = toISODate(new Date())
    supabase
      .from('todos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', USER_ID)
      .eq('completed', false)
      .eq('due_date', today)
      .then(({ count }) => setDueToday(count || 0))
  }, [])

  function selectMode(next) {
    const prev = mode
    setMode(next) // optimistic
    fetch('/api/user/timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone_mode: next, timezone: ZONE_BY_MODE[next] }),
    }).catch(() => setMode(prev))
  }

  const resolvedZone = ZONE_BY_MODE[mode] || ZONE_BY_MODE.oregon
  const abbrev = zoneAbbrev(resolvedZone)

  return (
    <div>
      <div className="header-top">
        <div>
          <div className="eyebrow">{formatEyebrowDate()}</div>
          <div className="header-greeting">Good {greetingPart()}, Shane.</div>
          <div className="quote-block">
            <p className="quote-text">&ldquo;{quote.text}&rdquo;</p>
            <div className="quote-attr">{quote.author} · Quote of the day</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="location-pin">&#128205;</span>
          <div className="tz-toggle">
            <button
              className={`tz-pill ${mode === 'oregon' ? 'active' : ''}`}
              onClick={() => selectMode('oregon')}
            >
              Oregon
            </button>
            <button
              className={`tz-pill ${mode === 'hawaii' ? 'active' : ''}`}
              onClick={() => selectMode('hawaii')}
            >
              Hawai&apos;i
            </button>
            <span className="tz-pill readout">{abbrev || 'HST'}</span>
          </div>
          </div>

          <div className="due-today">
            <div className="due-today-num">{dueToday}</div>
            <div className="due-today-label">DUE TODAY</div>
          </div>
        </div>
      </div>
    </div>
  )
}
