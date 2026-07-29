import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { toISODate, addDays } from '../lib/dateUtils.js'
import { computeStreak, streakLabel } from '../lib/goalStreak.js'

export default function GoalsSeason() {
  const [goals, setGoals] = useState([])
  const [logsByGoal, setLogsByGoal] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: goalRows } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('pinned', true)
        .order('created_at', { ascending: true })

      const list = goalRows || []
      if (cancelled) return
      setGoals(list)

      if (list.length > 0) {
        const ids = list.map((g) => g.id)
        const { data: logRows } = await supabase
          .from('goal_logs')
          .select('goal_id, date, done')
          .in('goal_id', ids)

        const grouped = {}
        for (const row of logRows || []) {
          if (!grouped[row.goal_id]) grouped[row.goal_id] = []
          grouped[row.goal_id].push(row)
        }
        if (!cancelled) setLogsByGoal(grouped)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Goals This Season</h2>
      </div>
      <div className="section-sub">Pinned goals, tracked daily</div>

      {loading && <div className="empty-state">Loading goals…</div>}
      {!loading && goals.length === 0 && <div className="empty-state">No pinned goals yet.</div>}

      {!loading && goals.length > 0 && (
        <div className="row row-wrap">
          {goals.map((goal) => {
            const logs = logsByGoal[goal.id] || []
            const doneDates = new Set(logs.filter((l) => l.done).map((l) => l.date))
            const streak = computeStreak(doneDates)

            let progress
            if (goal.target_value) {
              progress = Math.min(1, (parseFloat(goal.current_value) || 0) / parseFloat(goal.target_value))
            } else {
              const cutoffISO = toISODate(addDays(new Date(), -30))
              const recentDone = logs.filter((l) => l.done && l.date >= cutoffISO).length
              progress = Math.min(1, recentDone / 30)
            }

            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-card-title">{goal.title}</div>
                <div className="goal-card-streak">{streakLabel(streak)}</div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(progress * 100)}%`, background: '#e0607a' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
