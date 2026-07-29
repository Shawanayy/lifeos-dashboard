import { useState } from 'react'

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventModal({ initial, isNew, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(initial.title || '')
  const [start, setStart] = useState(toLocalInputValue(initial.start))
  const [end, setEnd] = useState(toLocalInputValue(initial.end))
  const [location, setLocation] = useState(initial.location || '')

  function handleSave() {
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!title.trim() || endDate <= startDate) return
    onSave({ title: title.trim(), start: startDate, end: endDate, location: location.trim() })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label>
          Start
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          End
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label>
          Location
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>

        <div className="modal-actions">
          {!isNew ? (
            <button className="btn danger" onClick={onDelete}>Delete</button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
