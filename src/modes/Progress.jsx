import { useState, useEffect } from 'react'
import { getStats, clearStats } from '../hooks/useStats.js'
import { PUZZLES } from '../data/puzzles.js'

const ALL_THEMES = [...new Set(PUZZLES.map(p => p.theme))]
const LEVEL_THRESHOLD = 0.75

function solveRate(bucket) {
  if (!bucket || bucket.attempts === 0) return null
  return bucket.solved / bucket.attempts
}

function barColor(rate) {
  if (rate === null) return '#2a2a4a'
  if (rate < 0.5) return '#e05454'
  if (rate < LEVEL_THRESHOLD) return '#f0c040'
  return '#34c37a'
}

function ThemeBar({ theme, bucket, rate }) {
  const pct = rate !== null ? Math.round(rate * 100) : null
  const color = barColor(rate)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: rate === null ? '#444' : '#ccc' }}>{theme}</span>
        <span style={{ color: '#555', fontSize: 12 }}>
          {pct !== null ? `${pct}%` : '—'}
          {bucket?.attempts ? ` · ${bucket.attempts} attempt${bucket.attempts !== 1 ? 's' : ''}` : ''}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#1e2a42', overflow: 'hidden' }}>
        {pct !== null && (
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
        )}
      </div>
    </div>
  )
}

function NextLevelRow({ theme, rate }) {
  const pct = Math.round(rate * 100)
  const needed = Math.max(0, Math.round((LEVEL_THRESHOLD - rate) * 100))
  const ready = rate >= LEVEL_THRESHOLD
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
      <span style={{ width: 16, textAlign: 'center', color: ready ? '#34c37a' : '#e05454', flexShrink: 0 }}>
        {ready ? '✓' : '✗'}
      </span>
      <span style={{ minWidth: 160, color: '#ccc' }}>{theme}</span>
      <span style={{ color: barColor(rate), fontWeight: 600 }}>{pct}%</span>
      <span style={{ color: '#555', fontSize: 12 }}>
        {ready ? 'Ready' : `Need ${needed}% more`}
      </span>
    </div>
  )
}

export default function Progress({ onNav }) {
  const [stats, setStats] = useState(() => getStats())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => { setStats(getStats()) }, [])

  const { themeStats } = stats
  const hasData = Object.keys(themeStats).length > 0

  if (!hasData) {
    return (
      <div>
        <h2 style={{ marginBottom: 8 }}>My Progress</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>Track your weaknesses and path to 900 ELO.</p>
        <div style={{ background: '#16213e', borderRadius: 10, padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📈</p>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No data yet</p>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
            Solve some puzzles and your performance stats will appear here.
          </p>
          <button className="btn-primary" onClick={() => onNav('puzzles')}>Go to Puzzles →</button>
        </div>
      </div>
    )
  }

  const themeData = ALL_THEMES.map(theme => ({
    theme,
    bucket: themeStats[theme] ?? null,
    rate: solveRate(themeStats[theme]),
  }))

  const attempted = themeData.filter(d => d.rate !== null)
  const unattempted = themeData.filter(d => d.rate === null)
  const sorted = [
    ...attempted.sort((a, b) => a.rate - b.rate),
    ...unattempted,
  ]

  const top3 = attempted.slice().sort((a, b) => a.rate - b.rate).slice(0, 3)
  const readyCount = attempted.filter(d => d.rate >= LEVEL_THRESHOLD).length
  const overallPct = attempted.length
    ? Math.round(attempted.reduce((s, d) => s + d.rate, 0) / attempted.length * 100)
    : 0

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>My Progress</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
        {attempted.length} of {ALL_THEMES.length} themes attempted · overall solve rate {overallPct}%
      </p>

      {/* Top weaknesses callout */}
      {top3.length > 0 && top3[0].rate < LEVEL_THRESHOLD && (
        <div style={{ background: '#1e1016', border: '1px solid #e0545433', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#e05454', fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}>YOUR BIGGEST GAPS</p>
          <p style={{ fontSize: 14, color: '#e0e0e0' }}>
            {top3.filter(d => d.rate < LEVEL_THRESHOLD).map(d => `${d.theme} (${Math.round(d.rate * 100)}%)`).join('  ·  ')}
          </p>
        </div>
      )}

      {/* 900 ELO progress summary */}
      <div style={{ background: '#16213e', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 600 }}>PATH TO 900 ELO</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: readyCount === attempted.length && attempted.length > 0 ? '#34c37a' : '#e0e0e0' }}>
            {readyCount} / {attempted.length} themes ready
          </p>
          <p style={{ fontSize: 12, color: '#555', marginTop: 2 }}>75%+ solve rate per theme</p>
        </div>
        <button
          className="btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => onNav('puzzles-train')}
        >
          Train My Weaknesses →
        </button>
      </div>

      {/* Theme performance bars */}
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, color: '#888', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theme Performance</h3>
        {sorted.map(({ theme, bucket, rate }) => (
          <ThemeBar key={theme} theme={theme} bucket={bucket} rate={rate} />
        ))}
      </section>

      {/* Path to 900 detail */}
      {attempted.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, color: '#888', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            900 ELO Checklist
          </h3>
          {attempted.sort((a, b) => a.rate - b.rate).map(({ theme, rate }) => (
            <NextLevelRow key={theme} theme={theme} rate={rate} />
          ))}
        </section>
      )}

      {/* Reset stats */}
      <div style={{ marginTop: 8 }}>
        {confirmReset ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#888' }}>Reset all stats?</span>
            <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => { clearStats(); setStats(getStats()); setConfirmReset(false) }}>
              Yes, reset
            </button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', opacity: 0.5 }} onClick={() => setConfirmReset(true)}>
            Reset Stats
          </button>
        )}
      </div>
    </div>
  )
}
