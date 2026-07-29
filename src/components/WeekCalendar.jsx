import { useEffect, useRef, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { addDays, formatDayHeader, formatRange, formatTime, isSameDay, startOfDay } from '../lib/dateUtils.js'
import { colorForKey } from '../lib/constants.js'
import EventModal from './EventModal.jsx'

const GRID_START_HOUR = 7
const GRID_END_HOUR = 24
const PX_PER_MIN = 1
const TOTAL_MIN = (GRID_END_HOUR - GRID_START_HOUR) * 60
const LABEL_HOURS = [8, 10, 12, 14, 16, 18, 20, 22]
const SNAP_MIN = 15
const DRAG_THRESHOLD_PX = 5

function hourLabel(h) {
  const period = h >= 12 ? 'PM' : 'AM'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return `${hour12}${period}`
}

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function calendarLabel(id) {
  if (!id) return 'Dashboard'
  if (id.includes('@') && !id.includes('group.calendar.google.com')) return 'Personal'
  return `${id.slice(0, 6)}…`
}

function snap(n, step) {
  return Math.round(n / step) * step
}

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { isNew, event, initial }
  const [dragPreview, setDragPreview] = useState(null) // { id, dayIndex, topMin, durMin }
  const [, forceTick] = useState(0)

  const dragRef = useRef(null)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 7)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('pending_delete', false)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString())
      .order('start_time', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  // Re-render every minute so the "now" line stays live.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const legendEntries = (() => {
    const seen = new Map()
    for (const ev of events) {
      const key = ev.gcal_calendar_id || 'null'
      if (!seen.has(key)) seen.set(key, calendarLabel(ev.gcal_calendar_id))
    }
    return Array.from(seen.entries())
  })()

  function openCreateModal(dayIndex, startMin) {
    const day = days[dayIndex]
    const startDate = new Date(day)
    startDate.setHours(0, startMin, 0, 0)
    const endDate = new Date(startDate.getTime() + 60 * 60000)
    setModal({
      isNew: true,
      dayIndex,
      initial: { title: '', start: startDate, end: endDate, location: '' },
    })
  }

  function openEditModal(ev) {
    setModal({
      isNew: false,
      event: ev,
      initial: {
        title: ev.title,
        start: new Date(ev.start_time),
        end: new Date(ev.end_time),
        location: ev.location || '',
      },
    })
  }

  async function handleModalSave(values) {
    if (modal.isNew) {
      const payload = {
        user_id: USER_ID,
        title: values.title,
        start_time: values.start.toISOString(),
        end_time: values.end.toISOString(),
        location: values.location || null,
        source: 'Dashboard',
        needs_gcal_sync: true,
        gcal_calendar_id: null,
        pending_delete: false,
      }
      const { data } = await supabase.from('calendar_events').insert(payload).select()
      if (data && data[0]) setEvents((prev) => [...prev, data[0]])
    } else {
      const ev = modal.event
      const updated = {
        title: values.title,
        start_time: values.start.toISOString(),
        end_time: values.end.toISOString(),
        location: values.location || null,
        needs_gcal_sync: true,
      }
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, ...updated } : e)))
      await supabase.from('calendar_events').update(updated).eq('id', ev.id)
    }
    setModal(null)
  }

  async function handleModalDelete() {
    const ev = modal.event
    setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    await supabase
      .from('calendar_events')
      .update({ pending_delete: true, needs_gcal_sync: true })
      .eq('id', ev.id)
    setModal(null)
  }

  function handleColumnClick(dayIndex, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesIntoGrid = snap(y / PX_PER_MIN, 30)
    openCreateModal(dayIndex, GRID_START_HOUR * 60 + minutesIntoGrid)
  }

  function handlePointerDownOnEvent(e, ev) {
    e.stopPropagation()
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startMin = minutesFromMidnight(new Date(ev.start_time)) - GRID_START_HOUR * 60
    const durMin = (new Date(ev.end_time) - new Date(ev.start_time)) / 60000
    const originDayIndex = days.findIndex((d) => isSameDay(d, new Date(ev.start_time)))

    dragRef.current = {
      ev,
      startClientX,
      startClientY,
      startMin,
      durMin,
      originDayIndex,
      moved: false,
    }
    e.target.setPointerCapture(e.pointerId)

    function onMove(moveEvent) {
      const drag = dragRef.current
      if (!drag) return
      const deltaX = moveEvent.clientX - drag.startClientX
      const deltaY = moveEvent.clientY - drag.startClientY
      if (!drag.moved && Math.abs(deltaX) < DRAG_THRESHOLD_PX && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        return
      }
      drag.moved = true

      const minuteDelta = snap(deltaY / PX_PER_MIN, SNAP_MIN)
      let newTopMin = Math.max(0, Math.min(TOTAL_MIN - drag.durMin, drag.startMin + minuteDelta))

      const colEl = document.elementFromPoint(moveEvent.clientX, drag.startClientY + (moveEvent.clientY - drag.startClientY))
      let dayIndex = drag.originDayIndex
      const colMatch = colEl && colEl.closest ? colEl.closest('[data-day-index]') : null
      if (colMatch) dayIndex = parseInt(colMatch.dataset.dayIndex, 10)

      const preview = { id: drag.ev.id, dayIndex, topMin: newTopMin, durMin: drag.durMin }
      drag.preview = preview
      setDragPreview(preview)
    }

    async function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const drag = dragRef.current
      dragRef.current = null

      if (!drag) return

      if (drag.moved) {
        const preview = drag.preview
        setDragPreview(null)
        if (preview) {
          const newDay = days[preview.dayIndex]
          const newStart = new Date(newDay)
          newStart.setHours(0, GRID_START_HOUR * 60 + preview.topMin, 0, 0)
          const newEnd = new Date(newStart.getTime() + preview.durMin * 60000)

          setEvents((prev) =>
            prev.map((e) =>
              e.id === drag.ev.id
                ? { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
                : e,
            ),
          )
          await supabase
            .from('calendar_events')
            .update({
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
              needs_gcal_sync: true,
            })
            .eq('id', drag.ev.id)
        }
      } else {
        openEditModal(drag.ev)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const now = new Date()
  const nowMinutes = minutesFromMidnight(now) - GRID_START_HOUR * 60
  const showNowLine = nowMinutes >= 0 && nowMinutes <= TOTAL_MIN

  return (
    <div className="card">
      <div className="section-header">
        <div className="week-nav">
          <h2 className="section-title">Next 7 Days</h2>
          <button onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Previous week">‹</button>
          <button onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Next week">›</button>
        </div>
        <span className="section-meta">{formatRange(days[0], days[6])} · from Google Calendar</span>
      </div>

      <div className="calendar-legend">
        {legendEntries.map(([key, label]) => (
          <div className="legend-item" key={key}>
            <span className="legend-dot" style={{ background: colorForKey(key) }} />
            {label}
          </div>
        ))}
        {legendEntries.length === 0 && <span className="muted">No events this week</span>}
      </div>

      <div className="week-grid-outer">
        <div className="week-grid-headers">
          <div />
          {days.map((d, i) => (
            <div key={i} className={`week-day-header ${isSameDay(d, now) ? 'today' : ''}`}>
              {formatDayHeader(d)}
            </div>
          ))}
        </div>

        <div className="week-grid-body" style={{ height: TOTAL_MIN * PX_PER_MIN }}>
          <div className="hour-labels">
            {LABEL_HOURS.map((h) => (
              <div
                key={h}
                className="hour-label"
                style={{ top: (h - GRID_START_HOUR) * 60 * PX_PER_MIN }}
              >
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.start_time), day))
            return (
              <div
                key={dayIndex}
                className="day-column"
                data-day-index={dayIndex}
                onClick={(e) => handleColumnClick(dayIndex, e)}
              >
                {isSameDay(day, now) && showNowLine && (
                  <div className="now-line" style={{ top: nowMinutes * PX_PER_MIN }} />
                )}

                {dayEvents.map((ev) => {
                  const isDragged = dragPreview && dragPreview.id === ev.id
                  if (isDragged && dragPreview.dayIndex !== dayIndex) return null

                  const startMin = isDragged
                    ? dragPreview.topMin
                    : minutesFromMidnight(new Date(ev.start_time)) - GRID_START_HOUR * 60
                  const durMin = isDragged
                    ? dragPreview.durMin
                    : (new Date(ev.end_time) - new Date(ev.start_time)) / 60000

                  const top = Math.max(0, startMin) * PX_PER_MIN
                  const height = Math.max(18, durMin * PX_PER_MIN)
                  const color = colorForKey(ev.gcal_calendar_id || 'null')

                  return (
                    <div
                      key={ev.id}
                      className="event-block"
                      style={{ top, height, background: color }}
                      onPointerDown={(e) => handlePointerDownOnEvent(e, ev)}
                    >
                      <span className="ev-title">{ev.title}</span>
                      <span className="ev-time">{formatTime(new Date(ev.start_time))}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {loading && <div className="empty-state">Loading calendar…</div>}

      {modal && (
        <EventModal
          initial={modal.initial}
          isNew={modal.isNew}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
