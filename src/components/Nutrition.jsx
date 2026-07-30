import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { toISODate } from '../lib/dateUtils.js'
import { NUTRITION_TARGETS, NUTRITION_COLORS } from '../lib/constants.js'

export default function Nutrition() {
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0, sugar: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = toISODate(new Date())
      const { data } = await supabase
        .from('nutrition_logs')
        .select('calories, protein, fat, carbs, sugar')
        .eq('user_id', USER_ID)
        .eq('date', today)

      const sums = { calories: 0, protein: 0, fat: 0, carbs: 0, sugar: 0 }
      for (const row of data || []) {
        sums.calories += row.calories || 0
        sums.protein += row.protein || 0
        sums.fat += Number(row.fat) || 0
        sums.carbs += row.carbs || 0
        sums.sugar += Number(row.sugar) || 0
      }
      setTotals(sums)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header">
        <h2 className="section-title">Nutrition</h2>
      </div>
      <div className="section-sub">Today&apos;s intake</div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && (
        <div className="nutrition-chart">
          {Object.entries(NUTRITION_TARGETS).map(([key, meta]) => {
            const value = totals[key] || 0
            const pct = Math.min(1, value / meta.target)
            const over = value > meta.target
            const colors = NUTRITION_COLORS[key] || { base: '#d98a96', over: '#d98a96' }
            return (
              <div className="nutrition-bar-wrap" key={key}>
                <div className="nutrition-bar-track">
                  <div
                    className="nutrition-bar-fill"
                    style={{
                      height: `${Math.round(pct * 100)}%`,
                      background: over ? colors.over : colors.base,
                      boxShadow: `0 0 8px ${(over ? colors.over : colors.base)}55`,
                    }}
                  />
                </div>
                <div className="nutrition-bar-name">{meta.label}</div>
                <div className="nutrition-bar-label">
                  {value}{meta.unit} / {meta.target}{meta.unit}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
