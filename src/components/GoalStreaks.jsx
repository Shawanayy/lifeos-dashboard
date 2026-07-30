import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { toISODate, addDays } from '../lib/dateUtils.js'
import { computeStreak, streakLabel } from '../lib/goalStreak.js'
import { initialsFor, HABIT_GRADIENTS } from '../lib/constants.js'

const WEEKS_VISIBLE = 10

function buildWeeks(doneDates) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalDays = WEEKS_VISIBLE * 7
  // Align the grid so the last column ends today.
  const start = addDays(today, -(totalDays - 1))
  const weeks = []
  let cursor = start
  for (let w = 0; w < WEEKS_VISIBLE; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const iso = toISODate(cursor)
      col.push({ iso, done: doneDates.has(iso), isToday: iso === toISODate(today) })
      cursor = addDays(cursor, 1)
    }
    weeks.push(col)
  }
  return weeks
}

function GoalCard({ goal, logs, onToggleToday, onLogQuantity, index }) {
  const [qty, setQty] = useState('')
  const doneDates = new Set(logs.filter((l) => l.done).map((l) => l.date))
  const streak = computeStreak(doneDates)
  const { grad, hue } = HABIT_GRADIENTS[index % HABIT_GRADIENTS.length]
  const color = grad
  const weeks = buildWeeks(doneDates)
  const todayISO = toISODate(new Date())
  const doneToday = doneDates.has(todayISO)
  const isQuantity = goal.target_value != null && goal.target_value !== ''
  const todayLog = logs.find((l) => l.date === todayISO)
  const todayValue = todayLog?.value || 0

  function submitQty() {
    const amount = parseFloat(qty)
    if (!amount) return
    onLogQuantity(goal.id, amount)
    setQty('')
  }

  return (
    <div className="card goal-detail-card">
      <div className="goal-detail-head">
        <div className="avatar-bubble" style={{ background: color }}>
          {initialsFor(goal.title)}
        </div>
        <div>
          <div className="goal-detail-title">{goal.title}</div>
          <div className="goal-detail-streak">{streakLabel(streak)}</div>
        </div>
        {isQuantity ? (
          <div className="goal-qty-row">
            <input
              type="number"
              inputMode="decimal"
              placeholder={goal.unit || 'qty'}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitQty()}
              className="goal-qty-input"
            />
            <button className="goal-log-btn" onClick={submitQty} title="Log amount">
              +
            </button>
          </div>
        ) : (
          <button
            className={`goal-log-btn ${doneToday ? 'done' : ''}`}
            onClick={() => onToggleToday(goal.id)}
            title="Log today"
          >
            +
          </button>
        )}
      </div>

      <div className="heatmap">
        {weeks.map((col, i) => (
          <div className="heatmap-col" key={i}>
            {col.map((day) => (
              <div
                key={day.iso}
                className={`heatmap-cell ${day.isToday ? 'today' : ''}`}
                style={{
                  background: day.done ? color : undefined,
                  boxShadow: day.done ? `0 0 6px ${hue}66` : undefined,
                }}
                title={day.iso}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="goal-detail-footer">
        <span className="muted">Feeds · {goal.title}</span>
        {isQuantity ? (
          <span className="toggle-text" style={{ color: todayValue > 0 ? '#4caf82' : '#8a7a7d' }}>
            {todayValue > 0 ? `${todayValue}${goal.unit || ''} logged today` : 'Nothing logged today'}
          </span>
        ) : (
          <span className="toggle-text" style={{ color: doneToday ? '#4caf82' : '#8a7a7d' }} onClick={() => onToggleToday(goal.id)}>
            {doneToday ? 'Done today' : 'Not yet today'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function GoalStreaks() {
  const [goals, setGoals] = useState([])
  const [logsByGoal, setLogsByGoal] = useState({})
  const [loading, setLoading] = useState(true)

  async function loadLogsFor(ids) {
    if (ids.length === 0) return {}
    const cutoffISO = toISODate(addDays(new Date(), -(WEEKS_VISIBLE * 7 + 2)))
    const { data } = await supabase
      .from('goal_logs')
      .select('goal_id, date, done, value')
      .in('goal_id', ids)
      .gte('date', cutoffISO)
    const grouped = {}
    for (const row of data || []) {
      if (!grouped[row.goal_id]) grouped[row.goal_id] = []
      grouped[row.goal_id].push(row)
    }
    return grouped
  }

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
      const grouped = await loadLogsFor(list.map((g) => g.id))
      if (!cancelled) {
        setLogsByGoal(grouped)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function toggleToday(goalId) {
    const todayISO = toISODate(new Date())
    const existing = (logsByGoal[goalId] || []).find((l) => l.date === todayISO)

    // optimistic update
    setLogsByGoal((prev) => {
      const next = { ...prev }
      const list = [...(next[goalId] || [])]
      const idx = list.findIndex((l) => l.date === todayISO)
      if (idx >= 0) {
        list[idx] = { ...list[idx], done: !list[idx].done }
      } else {
        list.push({ goal_id: goalId, date: todayISO, done: true })
      }
      next[goalId] = list
      return next
    })

    if (existing) {
      await supabase
        .from('goal_logs')
        .update({ done: !existing.done })
        .eq('goal_id', goalId)
        .eq('date', todayISO)
    } else {
      await supabase.from('goal_logs').upsert(
        { goal_id: goalId, date: todayISO, done: true },
        { onConflict: 'goal_id,date' },
      )
    }
  }

  async function logQuantity(goalId, amount) {
    const todayISO = toISODate(new Date())
    const existing = (logsByGoal[goalId] || []).find((l) => l.date === todayISO)
    const newValue = (existing?.value || 0) + amount

    // optimistic update
    setLogsByGoal((prev) => {
      const next = { ...prev }
      const list = [...(next[goalId] || [])]
      const idx = list.findIndex((l) => l.date === todayISO)
      if (idx >= 0) {
        list[idx] = { ...list[idx], value: newValue, done: true }
      } else {
        list.push({ goal_id: goalId, date: todayISO, done: true, value: newValue })
      }
      next[goalId] = list
      return next
    })

    await supabase.from('goal_logs').upsert(
      { goal_id: goalId, date: todayISO, done: true, value: newValue },
      { onConflict: 'goal_id,date' },
    )

    const goal = goals.find((g) => g.id === goalId)
    if (goal) {
      const newCurrent = (parseFloat(goal.current_value) || 0) + amount
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, current_value: newCurrent } : g)))
      await supabase.from('goals').update({ current_value: newCurrent }).eq('id', goalId)
    }
  }

  if (loading) return null
  if (goals.length === 0) return null

  return (
    <div className="row row-wrap" style={{ alignItems: 'stretch', gap: 20 }}>
      {goals.map((goal, index) => (
        <div key={goal.id} style={{ flex: '1 1 300px' }}>
          <GoalCard
            goal={goal}
            logs={logsByGoal[goal.id] || []}
            onToggleToday={toggleToday}
            onLogQuantity={logQuantity}
            index={index}
          />
        </div>
      ))}
    </div>
  )
}
