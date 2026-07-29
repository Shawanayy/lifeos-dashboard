import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'

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
            return (
              <div className="grade-card" key={cls.id}>
                <div>
                  <div className="grade-class-name">{cls.name}</div>
                  <div className="grade-class-code">{cls.code}</div>
                </div>
                <div className="grade-value">{grade ? grade.current_grade : '—'}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
