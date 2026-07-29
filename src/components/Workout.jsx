import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { toISODate, daysInMonth, monthName, isSameDay } from '../lib/dateUtils.js'

export default function Workout() {
  const [trainedDates, setTrainedDates] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const now = new Date()

  async function load() {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const { data } = await supabase
      .from('workouts')
      .select('date, completed')
      .eq('user_id', USER_ID)
      .eq('completed', true)
      .gte('date', toISODate(first))
      .lte('date', toISODate(last))
    setTrainedDates(new Set((data || []).map((r) => r.date)))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleDay(dayNum) {
    const date = new Date(now.getFullYear(), now.getMonth(), dayNum)
    const iso = toISODate(date)
    const today = toISODate(new Date())
    const isPast = iso < today
    const isTrained = trainedDates.has(iso)

    if (isPast) {
      const verb = isTrained ? 'un-mark' : 'mark'
      const ok = window.confirm(`${verb === 'mark' ? 'Mark' : 'Unmark'} ${iso} as trained? This is a past day.`)
      if (!ok) return
    }

    if (isTrained) {
      setTrainedDates((prev) => {
        const next = new Set(prev)
        next.delete(iso)
        return next
      })
      await supabase.from('workouts').delete().eq('user_id', USER_ID).eq('date', iso)
    } else {
      setTrainedDates((prev) => new Set(prev).add(iso))
      await supabase.from('workouts').insert({ user_id: USER_ID, date: iso, completed: true })
    }
  }

  const total = daysInMonth(now)
  const days = Array.from({ length: total }, (_, i) => i + 1)

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Workout · {monthName(now)}</h2>
        <span className="section-meta" style={{ fontStyle: 'normal', fontFamily: 'Archivo' }}>
          {trainedDates.size} days
        </span>
      </div>
      <div className="section-sub">Tap a day you trained · warns before changing past days.</div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && (
        <div className="month-grid">
          {days.map((d) => {
            const date = new Date(now.getFullYear(), now.getMonth(), d)
            const iso = toISODate(date)
            const trained = trainedDates.has(iso)
            const today = isSameDay(date, new Date())
            return (
              <div
                key={d}
                className={`month-cell ${trained ? 'trained' : ''} ${today ? 'today' : ''}`}
                onClick={() => toggleDay(d)}
              >
                {d}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
