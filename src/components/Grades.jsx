import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { gradeColor, gradeGradient } from '../lib/constants.js'

export default function Grades() {
  const [classes, setClasses] = useState([])
  const [grades, setGrades] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: classRows } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: true })
        .limit(4)

      const list = classRows || []
      setClasses(list)

      if (list.length > 0) {
        const { data: gradeRows } = await supabase
          .from('grades')
          .select('*')
          .in('class_id', list.map((c) => c.id))
        const byClass = {}
        for (const g of gradeRows || []) byClass[g.class_id] = g
        setGrades(byClass)
      }
      setLoading(false)
    }
    load()
  }, [])

  // GPA is only computable once grades exist; the live app shows this as a stub too.
  const gradedRows = Object.values(grades).filter((g) => g.percent != null)
  const gpaText = gradedRows.length > 0
    ? (gradedRows.reduce((sum, g) => sum + Number(g.percent), 0) / gradedRows.length / 25).toFixed(2)
    : '—'

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Grades · Canvas</h2>
        <span className="section-meta">GPA {gpaText} · this term</span>
      </div>

      {loading && <div className="empty-state">Loading classes…</div>}
      {!loading && classes.length === 0 && <div className="empty-state">No classes synced from Canvas yet.</div>}

      {!loading && classes.length > 0 && (
        <div className="grades-row">
          {classes.map((cls) => {
            const grade = grades[cls.id]
            const pct = (grade && grade.percent) || 0
            return (
              <div className="grade-card" key={cls.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="grade-class-name">{cls.name}</div>
                    <div className="grade-class-code">{cls.code}</div>
                  </div>
                  <div className="grade-value" style={{ color: gradeColor(pct) }}>
                    {grade ? grade.current_grade : '—'}
                  </div>
                </div>
                <div className="progress-track" style={{ height: 6, marginTop: 16 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: gradeGradient(pct) }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#8a7a7d' }}>—</span>
                  <span style={{ fontSize: 12, color: '#b5868c' }}>{grade ? pct.toFixed(1) : ''}{grade ? '%' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
