import { useEffect, useState } from 'react'
import { supabase, USER_ID } from '../lib/supabase.js'
import { monthName } from '../lib/dateUtils.js'
import { formatCurrency, formatSignedCurrency, formatPercent } from '../lib/format.js'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: summaryData }, { data: holdingsData }, { data: billsData }, { data: accountsData }] =
        await Promise.all([
          supabase.from('portfolio_summary').select('*').eq('user_id', USER_ID).maybeSingle(),
          supabase.from('holdings').select('*').eq('user_id', USER_ID),
          supabase.from('bills').select('*').eq('user_id', USER_ID).order('due_day', { ascending: true }),
          supabase.from('accounts').select('*').eq('user_id', USER_ID).order('balance', { ascending: false }),
        ])
      setSummary(summaryData || null)
      setHoldings(holdingsData || [])
      setBills(billsData || [])
      setAccounts(accountsData || [])
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
        <div className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>Cash Accounts</div>
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
        <div style={{ flex: '4 1 0%', minWidth: 320 }}>
          <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>My Positions</div>
          {holdings.length === 0 && <div className="empty-state">No positions yet.</div>}
          <div className="holdings-grid">
            {holdings.map((h) => {
              const positive = Number(h.pct_return) >= 0
              const points = sparklinePoints(h.ticker + h.id, positive)
              return (
                <div className="holding-card" key={h.id}>
                  <div className="holding-ticker">{h.ticker}</div>
                  <svg viewBox="0 0 100 60" width="100%" height="40" preserveAspectRatio="none">
                    <polyline
                      points={points}
                      fill="none"
                      stroke={positive ? '#7fb494' : '#d98a96'}
                      strokeWidth="2"
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

        <div style={{ flex: '2.5 1 0%', minWidth: 220 }}>
          <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Savings Goals</div>
          <div className="empty-state">No savings goals seeded yet.</div>
        </div>

        <div style={{ flex: '2.5 1 0%', minWidth: 220 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div className="section-title" style={{ fontSize: 16 }}>Bills · {monthName()}</div>
            <span className="muted" style={{ fontSize: 13 }}>{paidCount}/{bills.length} paid</span>
          </div>
          {bills.length === 0 && <div className="empty-state">No bills tracked yet.</div>}
          <div className="bills-list">
            {bills.map((bill) => (
              <div className="bill-row" key={bill.id}>
                <input
                  type="checkbox"
                  checked={!!bill.paid_this_month}
                  onChange={() => toggleBillPaid(bill)}
                />
                <span className={`bill-name ${bill.paid_this_month ? 'paid' : ''}`}>{bill.name}</span>
              </div>
            ))}
          </div>
          {allPaid && <div className="bills-footer">All bills paid this month ✓</div>}
        </div>
      </div>
    </div>
  )
}
