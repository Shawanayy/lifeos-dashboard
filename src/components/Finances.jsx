import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { monthName } from '../lib/dateUtils.js'
import { formatCurrency, formatSignedCurrency, formatPercent } from '../lib/format.js'
import { GOAL_PROGRESS_GRADIENTS } from '../lib/constants.js'

function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 4294967296
  }
}

function sparklinePoints(ticker, positive) {
  const rand = seededRandom(String(ticker))
  const n = 12
  let y = 32
  const pts = []
  const drift = positive ? -1.4 : 1.4
  for (let i = 0; i < n; i++) {
    y += (rand() - 0.5) * 12 + drift
    y = Math.max(6, Math.min(54, y))
    pts.push(`${(i / (n - 1)) * 100},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

// Build a closed area path (line points + closing edge along the bottom) for
// filled sparkline area rendering. Uses viewBox 0 0 100 60 (matches polyline).
function sparklineAreaPath(pointsStr) {
  const pts = pointsStr.trim().split(/\s+/)
  if (pts.length === 0) return ''
  const first = pts[0].split(',')
  const last = pts[pts.length - 1].split(',')
  const lineSegs = pts.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ')
  return `${lineSegs} L${last[0]},60 L${first[0]},60 Z`
}

function StatCard({ label, value, colorBySign }) {
  const n = Number(value)
  const cls = colorBySign ? (n >= 0 ? 'positive' : 'negative') : ''
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${cls}`}>{value}</div>
    </div>
  )
}

export default function Finances() {
  const [summary, setSummary] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [bills, setBills] = useState([])
  const [accounts, setAccounts] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [spentThisMonth, setSpentThisMonth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const firstOfMonthISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const [
        { data: summaryData },
        { data: holdingsData },
        { data: billsData },
        { data: accountsData },
        { data: savingsData },
        { data: expenseData },
      ] = await Promise.all([
        supabase.from('portfolio_summary').select('*').eq('user_id', USER_ID).maybeSingle(),
        supabase.from('holdings').select('*').eq('user_id', USER_ID),
        supabase.from('bills').select('*').eq('user_id', USER_ID).order('due_day', { ascending: true }),
        supabase.from('accounts').select('*').eq('user_id', USER_ID).order('balance', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', USER_ID).eq('goal_type', 'Savings'),
        supabase.from('finances').select('amount').eq('user_id', USER_ID).eq('type', 'Expense').gte('date', firstOfMonthISO),
      ])
      setSummary(summaryData || null)
      setHoldings(holdingsData || [])
      setBills(billsData || [])
      setAccounts(accountsData || [])
      setSavingsGoals(savingsData || [])
      setSpentThisMonth((expenseData || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0))
      setLoading(false)
    }
    load()
  }, [])

  async function toggleBillPaid(bill) {
    setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, paid_this_month: !b.paid_this_month } : b)))
    await supabase.from('bills').update({ paid_this_month: !bill.paid_this_month }).eq('id', bill.id)
  }

  const paidCount = bills.filter((b) => b.paid_this_month).length
  const allPaid = bills.length > 0 && paidCount === bills.length

  if (loading) {
    return (
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Finances</h2>
        </div>
        <div className="empty-state">Loading finances…</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Finances</h2>
        <span className="section-meta">Synced from Google Sheet</span>
      </div>

      {summary && (
        <div className="stat-row">
          <StatCard label="Current Value" value={formatCurrency(summary.current_value)} />
          <StatCard label="Total Revenue" value={formatSignedCurrency(summary.total_revenue)} colorBySign />
          <StatCard label="Overall Return" value={formatPercent(summary.overall_return_pct)} colorBySign />
          <StatCard label="Gain · 1wk" value={formatPercent(summary.gain_week_pct)} colorBySign />
          <StatCard label="Gain · 1mo" value={formatPercent(summary.gain_month_pct)} colorBySign />
        </div>
      )}

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="eyebrow-title">Cash Accounts</div>
        {accounts.length === 0 && <div className="empty-state">No accounts linked yet.</div>}
        <div className="accounts-list">
          {accounts.map((acct) => (
            <div className="account-row" key={acct.id}>
              <div>
                <span className="account-name">{acct.name}</span>
                <span className="account-type">{acct.type}</span>
              </div>
              <div className="account-balance">{formatCurrency(acct.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ alignItems: 'stretch' }}>
        <div style={{ flex: '3 1 0%', minWidth: 280 }}>
          <div className="eyebrow-title">My Positions</div>
          {holdings.length === 0 && <div className="empty-state">No positions yet.</div>}
          <div className="holdings-grid">
            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
              <defs>
                <linearGradient id="sgUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7fb494" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7fb494" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="sgDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d98a96" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#d98a96" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="strokeUp" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5c8a72" />
                  <stop offset="100%" stopColor="#7fb494" />
                </linearGradient>
                <linearGradient id="strokeDown" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c2330" />
                  <stop offset="100%" stopColor="#d98a96" />
                </linearGradient>
              </defs>
            </svg>
            {holdings.map((h) => {
              const positive = Number(h.pct_return) >= 0
              const points = sparklinePoints(h.ticker + h.id, positive)
              const areaPath = sparklineAreaPath(points)
              return (
                <div className="holding-card" key={h.id}>
                  <div className="holding-ticker">{h.ticker}</div>
                  <svg viewBox="0 0 100 60" width="100%" height="40" preserveAspectRatio="none">
                    <path d={areaPath} fill={positive ? 'url(#sgUp)' : 'url(#sgDown)'} />
                    <polyline
                      points={points}
                      fill="none"
                      stroke={positive ? 'url(#strokeUp)' : 'url(#strokeDown)'}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="holding-value">{formatCurrency(h.current_value)}</div>
                  <div className={`holding-gain ${positive ? 'positive' : 'negative'}`}>
                    {formatSignedCurrency(h.revenue)} ({formatPercent(h.pct_return)})
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ flex: '3 1 0%', minWidth: 240 }}>
          <div className="eyebrow-title">Savings goals</div>
          {savingsGoals.length === 0 && <div className="empty-state">No savings goals seeded yet.</div>}
          {savingsGoals.map((g) => {
            const target = Number(g.target_value) || 0
            const current = Number(g.current_value) || 0
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
            return (
              <div className="savings-goal-row" key={g.id}>
                <div className="savings-goal-head">
                  <span>{g.title}</span>
                  <span className="savings-goal-amounts">
                    {formatCurrency(current)} / {formatCurrency(target)}
                  </span>
                </div>
                <div className="savings-goal-track">
                  <div
                    className="savings-goal-fill"
                    style={{ width: `${pct}%`, background: GOAL_PROGRESS_GRADIENTS[0].grad }}
                  />
                </div>
              </div>
            )
          })}
          <div className="savings-spent-block">
            <div className="savings-spent-label">Spent · {monthName()}</div>
            <div className="savings-spent-value">{formatCurrency(spentThisMonth)}</div>
          </div>
        </div>

        <div style={{ flex: '2.5 1 0%', minWidth: 220 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div className="eyebrow-title" style={{ marginBottom: 0 }}>Bills · {monthName()}</div>
            <span className="bills-meta">{paidCount}/{bills.length} paid</span>
          </div>
          {bills.length === 0 && <div className="empty-state">No bills tracked yet.</div>}
          <div className="bills-list">
            {bills.map((bill) => (
              <div className="bill-row" key={bill.id}>
                <div
                  className={`bill-checkbox ${bill.paid_this_month ? 'done' : ''}`}
                  role="checkbox"
                  aria-checked={!!bill.paid_this_month}
                  onClick={() => toggleBillPaid(bill)}
                >
                  {bill.paid_this_month ? '✓' : ''}
                </div>
                <span className={`bill-name ${bill.paid_this_month ? 'paid' : ''}`}>{bill.name}</span>
                {bill.amount != null && (
                  <span className="bill-amount">{formatCurrency(bill.amount)}</span>
                )}
              </div>
            ))}
          </div>
          {allPaid && <div className="bills-footer">All bills paid this month ✓</div>}
        </div>
      </div>
    </div>
  )
}
