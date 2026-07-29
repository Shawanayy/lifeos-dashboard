import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { PRIORITY_COLORS, CATEGORY_OPTIONS, CATEGORY_COLORS } from '../lib/constants.js'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [dueDate, setDueDate] = useState('')

  async function load() {
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
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)))
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id)
  }

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">To-Do List</h2>
        <span className="section-meta" style={{ fontStyle: 'normal', fontFamily: 'Archivo' }}>
          {completedCount}/{todos.length} done
        </span>
      </div>
      <div className="section-sub">Colour = priority · tag = category</div>

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

      <div className="todo-list">
        {todos.map((todo) => (
          <div className="todo-row" key={todo.id}>
            <div
              className="todo-priority-bar"
              style={{ background: PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.Medium }}
            />
            <input type="checkbox" checked={!!todo.completed} onChange={() => toggleCompleted(todo)} />
            <span className={`todo-title ${todo.completed ? 'done' : ''}`}>{todo.title}</span>
            {todo.category && (
              <span
                className="todo-cat-pill"
                style={{
                  fontSize: 10,
                  letterSpacing: '.5px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  borderRadius: 20,
                  padding: '4px 10px',
                  color: (CATEGORY_COLORS[todo.category] || {}).c || '#c9b8bb',
                  background: (CATEGORY_COLORS[todo.category] || {}).bg || 'rgba(236, 228, 216, 0.06)',
                }}
              >
                {todo.category}
              </span>
            )}
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
