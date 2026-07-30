// Extracted verbatim from original bundle's `Dc` object (priority color map).
export const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#b3243a',
  Medium: '#c79a3f',
  Low: '#5c8a72',
}

export const CATEGORY_OPTIONS = ['Personal', 'Work', 'School', 'Health', 'Finance']

// Extracted verbatim from original bundle's `Do` object (category color/background map).
// Only categories that also exist in the current data model are mapped here;
// "Health" and "Finance" are not present in the original design (it used
// School/Work/Personal/Activities/!!!/Other instead), so no evidence exists for them.
export const CATEGORY_COLORS = {
  School: { c: '#e8a9b1', bg: 'rgba(217,138,150,.18)' },
  Work: { c: '#9db8e0', bg: 'rgba(124,154,199,.18)' },
  Personal: { c: '#7fb494', bg: 'rgba(92,138,114,.20)' },
  Activities: { c: '#dcb463', bg: 'rgba(199,154,63,.18)' },
  '!!!': { c: '#f06277', bg: 'rgba(179,36,58,.26)' },
  Other: { c: '#c39ecb', bg: 'rgba(168,127,176,.18)' },
}

// Extracted verbatim from original bundle's `Lc` array — rotating gradient
// palette used for Goals-This-Season progress bars (indexed by position, not hash).
export const GOAL_PROGRESS_GRADIENTS = [
  { hue: '#e29aa6', grad: 'linear-gradient(90deg,#7c2330,#e29aa6)' },
  { hue: '#8fc4a4', grad: 'linear-gradient(90deg,#3f6b52,#8fc4a4)' },
  { hue: '#e6c074', grad: 'linear-gradient(90deg,#9c6f23,#e6c074)' },
  { hue: '#cda6d4', grad: 'linear-gradient(90deg,#6f4a78,#cda6d4)' },
  { hue: '#9db8e0', grad: 'linear-gradient(90deg,#4a6a8c,#9db8e0)' },
  { hue: '#f0a07a', grad: 'linear-gradient(90deg,#8c4a2a,#f0a07a)' },
]

// Extracted verbatim from original bundle's `Bs` array — rotating gradient
// palette used for the Daily Habits / goal-streak avatar badges and heatmaps.
export const HABIT_GRADIENTS = [
  { hue: '#cda6d4', grad: 'linear-gradient(135deg,#6f4a78,#cda6d4)' },
  { hue: '#8fc4a4', grad: 'linear-gradient(135deg,#3f6b52,#8fc4a4)' },
  { hue: '#e29aa6', grad: 'linear-gradient(135deg,#7c2330,#e29aa6)' },
  { hue: '#e6c074', grad: 'linear-gradient(135deg,#9c6f23,#e6c074)' },
  { hue: '#9db8e0', grad: 'linear-gradient(135deg,#4a6a8c,#9db8e0)' },
  { hue: '#f0a07a', grad: 'linear-gradient(135deg,#8c4a2a,#f0a07a)' },
]

// Extracted verbatim from original bundle's `S0` array — per-macro colors used
// for the Nutrition bars (base = normal, over = over-target). Target thresholds
// themselves are left untouched (functional data, not style).
// Re-themed to the warm dusk palette (see design-reference.html ~411-425).
// Each macro provides a `base` and `over` gradient (used as `background`
// on the vertical bar fill). Values chosen from the palette family:
//   golds  #9c6f23 / #e6c074 / #c79a3f
//   reds   #7c2330 / #e29aa6 / #d98a96 / #b3243a
//   greens #3f6b52 / #5c8a72 / #8fc4a4 / #7fb494
//   blue-grays #4a6a8c / #6f8fb0 / #9db8e0
// The 3 gradients from the mockup are reused (Calories=gold, Protein=red,
// Sugar=green), then Fat and Carbs get two new complementary gradients so
// all 5 bars are visually distinct.
export const NUTRITION_COLORS = {
  calories: {
    base: 'linear-gradient(0deg,#9c6f23,#e6c074)',
    over: 'linear-gradient(0deg,#c79a3f,#e6c074)',
  },
  protein: {
    base: 'linear-gradient(0deg,#7c2330,#e29aa6)',
    over: 'linear-gradient(0deg,#b3243a,#e29aa6)',
  },
  fat: {
    base: 'linear-gradient(0deg,#4a6a8c,#9db8e0)',
    over: 'linear-gradient(0deg,#6f8fb0,#9db8e0)',
  },
  carbs: {
    base: 'linear-gradient(0deg,#8c4a2a,#f0a07a)',
    over: 'linear-gradient(0deg,#c79a3f,#f0a07a)',
  },
  sugar: {
    base: 'linear-gradient(0deg,#3f6b52,#8fc4a4)',
    over: 'linear-gradient(0deg,#5c8a72,#8fc4a4)',
  },
}

// Extracted verbatim from original bundle's `rw`/`nw` functions — grade-percent
// color scale used on the Grades cards.
export function gradeColor(pct) {
  if (pct >= 90) return '#7fb494'
  if (pct >= 80) return '#8fc4a4'
  if (pct >= 70) return '#e6c074'
  if (pct >= 60) return '#c79a3f'
  return '#d98a96'
}
export function gradeGradient(pct) {
  if (pct >= 90) return 'linear-gradient(90deg,#3f6b52,#8fc4a4)'
  if (pct >= 80) return 'linear-gradient(90deg,#5c8a72,#8fc4a4)'
  if (pct >= 70) return 'linear-gradient(90deg,#9c6f23,#e6c074)'
  if (pct >= 60) return 'linear-gradient(90deg,#c79a3f,#e6c074)'
  return 'linear-gradient(90deg,#7c2330,#d98a96)'
}

// NOTE: PALETTE/colorForKey below is NOT present in the original bundle.
// The real production app mapped calendar-legend/event colors from a
// hardcoded object of real Google Calendar IDs (`L0`), not a generic hash
// function over arbitrary keys. That mapping is account-specific data, not
// a visual-design token, so it is left untouched here (no generic fallback
// palette could be recovered as evidence).
export const PALETTE = [
  '#7c2330', '#d98a96', '#6f8fb0', '#c79a3f', '#5c8a72',
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
