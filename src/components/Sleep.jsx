import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'

const SLEEP_GOAL_HOURS = 8

export default function Sleep({ bare }) {
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', USER_ID)
        .order('date', { ascending: false })
        .limit(1)
      setLog((data && data[0]) || null)
      setLoading(false)
    }
    load()
  }, [])

  const hours = log ? Number(log.hours_slept) || 0 : 0
  const pct = Math.min(1, hours / SLEEP_GOAL_HOURS)

  return (
    <div className={bare ? '' : 'card'}>
      <div className="section-header">
        <h2 className="section-title">Sleep &amp; Recovery</h2>
        <span className="pill">{log ? (log.source || 'Watch') : 'Watch'}</span>
      </div>
      <div className="section-sub">Last night vs. your 8-hour goal</div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && !log && (
        <div className="empty-state">No sleep data logged yet.</div>
      )}

      {!loading && log && (
        <div className="sleep-row">
          <div>
            <div className="sleep-num">{hours}h</div>
            <div className="sleep-goal">of {SLEEP_GOAL_HOURS}h goal</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(pct * 100)}%`, background: '#7fb494' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
