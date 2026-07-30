import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { PRIORITY_COLORS, CATEGORY_OPTIONS, CATEGORY_COLORS } from '../lib/constants.js'

const AUTO_DELETE_AFTER_DAYS = 3

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [dueDate, setDueDate] = useState('')
  const [showDone, setShowDone] = useState(true)

  async function load() {
    const cutoffISO = new Date(Date.now() - AUTO_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('todos')
      .delete()
      .eq('user_id', USER_ID)
      .eq('completed', true)
      .lt('completed_at', cutoffISO)

    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', USER_ID)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setTodos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addTodo(e) {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      user_id: USER_ID,
      title: title.trim(),
      priority,
      category,
      due_date: dueDate || null,
      source: 'Dashboard',
    }
    const { data } = await supabase.from('todos').insert(payload).select()
    if (data && data[0]) setTodos((prev) => [...prev, data[0]])
    setTitle('')
    setDueDate('')
  }

  async function toggleCompleted(todo) {
    const nextCompleted = !todo.completed
    const completedAt = nextCompleted ? new Date().toISOString() : null
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: nextCompleted, completed_at: completedAt } : t)),
    )
    await supabase.from('todos').update({ completed: nextCompleted, completed_at: completedAt }).eq('id', todo.id)
  }

  async function cyclePriority(todo) {
    const order = ['Low', 'Medium', 'High']
    const idx = order.indexOf(todo.priority)
    const next = order[(idx + 1) % order.length] || 'Medium'
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, priority: next } : t)))
    await supabase.from('todos').update({ priority: next }).eq('id', todo.id)
  }

  async function updateCategory(todo, newCategory) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, category: newCategory } : t)))
    await supabase.from('todos').update({ category: newCategory }).eq('id', todo.id)
  }

  const completedCount = todos.filter((t) => t.completed).length
  const visibleTodos = showDone ? todos : todos.filter((t) => !t.completed)

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">To-Do List</h2>
        <span
          className="section-meta todo-done-toggle"
          style={{ fontStyle: 'normal', fontFamily: 'Archivo', cursor: 'pointer' }}
          onClick={() => setShowDone((s) => !s)}
          title={showDone ? 'Hide completed tasks' : 'Show completed tasks'}
        >
          {completedCount}/{todos.length} done
          <span className="todo-done-caret">{showDone ? ' ▾' : ' ▸'}</span>
        </span>
      </div>
      <div className="section-sub">Colour = priority · tag = mission</div>

      <form className="todo-add-row" onSubmit={addTodo}>
        <input
          type="text"
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button
          type="submit"
          className="btn"
          style={{
            fontWeight: 600,
            background: 'rgba(127,180,148,.18)',
            border: '1px solid rgba(127,180,148,.35)',
            color: '#8fc4a4',
          }}
        >
          Add
        </button>
      </form>

      {loading && <div className="empty-state">Loading tasks…</div>}
      {!loading && todos.length === 0 && <div className="empty-state">No tasks yet.</div>}
      {!loading && todos.length > 0 && visibleTodos.length === 0 && (
        <div className="empty-state">All done — nice work.</div>
      )}

      <div className="todo-list">
        {visibleTodos.map((todo) => (
          <div className="todo-row" key={todo.id}>
            <div
              className="todo-priority-bar"
              style={{ background: PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.Medium, cursor: 'pointer' }}
              title={`Priority: ${todo.priority || 'Medium'} (click to change)`}
              onClick={() => cyclePriority(todo)}
            />
            <div
              className={`todo-checkbox ${todo.completed ? 'done' : ''}`}
              role="checkbox"
              aria-checked={!!todo.completed}
              onClick={() => toggleCompleted(todo)}
            >
              {todo.completed ? '✓' : ''}
            </div>
            <div className="todo-title-wrap">
              <span className={`todo-title ${todo.completed ? 'done' : ''}`}>{todo.title}</span>
              {todo.due_date && (
                <div className="todo-meta">Due {todo.due_date}</div>
              )}
            </div>
            <select
              className="todo-cat-pill"
              value={todo.category || CATEGORY_OPTIONS[0]}
              onChange={(e) => updateCategory(todo, e.target.value)}
              title="Category (click to change)"
              style={{
                fontSize: 10,
                letterSpacing: '.5px',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 20,
                padding: '4px 10px',
                textAlign: 'center',
                textAlignLast: 'center',
                color: (CATEGORY_COLORS[todo.category] || {}).c || '#c9b8bb',
                background: (CATEGORY_COLORS[todo.category] || {}).bg || 'rgba(236, 228, 216, 0.06)',
                border: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} style={{ color: '#1a1213', background: '#ece4d8' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="todo-legend">
        <span><span className="legend-swatch" style={{ background: PRIORITY_COLORS.High }} />HIGH</span>
        <span><span className="legend-swatch" style={{ background: PRIORITY_COLORS.Medium }} />MEDIUM</span>
        <span><span className="legend-swatch" style={{ background: PRIORITY_COLORS.Low }} />LOW</span>
      </div>
    </div>
  )
}
