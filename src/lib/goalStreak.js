import { toISODate, addDays } from './dateUtils.js'

// Walk backward from today through a set of done-dates to find the current streak length.
export function computeStreak(doneDates) {
  let count = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (doneDates.has(toISODate(cursor))) count++
  cursor = addDays(cursor, -1)
  while (doneDates.has(toISODate(cursor))) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}

export function streakLabel(n) {
  return n > 0 ? `${n}-day streak` : 'No streak yet'
}
