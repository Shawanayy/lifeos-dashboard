export const PRIORITY_COLORS = {
  High: '#e0607a',
  Medium: '#d9a441',
  Low: '#4caf82',
}

export const CATEGORY_OPTIONS = ['Personal', 'Work', 'School', 'Health', 'Finance']

// Stable palette used for goal avatars/heatmaps and calendar legend dots.
export const PALETTE = [
  '#e0607a', '#4caf82', '#5b9bd5', '#d9a441',
  '#b57edc', '#4cb8b0', '#e08a3c', '#c76b6b',
]

// Small rotating set of quotes, keyed off day-of-year so it's stable per day.
export const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'What we do every day matters more than what we do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'James Clear' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'The days are long, but the years are short.', author: 'Gretchen Rubin' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
]

export function quoteOfDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export function colorForKey(key) {
  const str = String(key || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function initialsFor(title) {
  const words = String(title || '').trim().split(/\s+/)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export const NUTRITION_TARGETS = {
  calories: { label: 'Calories', target: 2650, unit: '' },
  protein: { label: 'Protein', target: 180, unit: 'g' },
  fat: { label: 'Fat', target: 75, unit: 'g' },
  carbs: { label: 'Carbs', target: 310, unit: 'g' },
  sugar: { label: 'Sugar', target: 45, unit: 'g' },
}
