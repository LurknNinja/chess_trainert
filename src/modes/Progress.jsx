import { useState, useEffect } from 'react'
import { getStats, clearStats } from '../hooks/useStats.js'
import { PUZZLES } from '../data/puzzles.js'
import { ALL_LESSONS } from '../data/lessons.js'
import StatCard from '../components/StatCard.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { evaluateAchievements } from '../utils/achievements.js'

const ALL_THEMES = [...new Set(PUZZLES.map(p => p.theme))]
const LEVEL_THRESHOLD = 0.75

const solveRate = (b) => (!b || b.attempts === 0 ? null : b.solved / b.attempts)
const barColor = (rate) => rate === null ? 'var(--surface-3)' : rate < 0.5 ? 'var(--danger)' : rate < LEVEL_THRESHOLD ? 'var(--warning)' : 'var(--success)'

function ThemeBar({ theme, bucket, rate }) {
  const pct = rate !== null ? Math.round(rate * 100) : null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: rate === null ? 'var(--muted-2)' : 'var(--text-soft)' }}>{theme}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {pct !== null ? `${pct}%` : '—'}{bucket?.attempts ? ` · ${bucket.attempts} tried` : ''}
        </span>
      </div>
      <div className="progress-bar">
        {pct !== null && <div className="progress-fill" style={{ width: `${pct}%`, background: barColor(rate) }} />}
      </div>
    </div>
  )
}

function RatingChart({ history }) {
  const pts = (history || []).filter(h => typeof h.rating === 'number')
  if (pts.length < 2) return null
  const W = 320, H = 90, pad = 6
  const ratings = pts.map(p => p.rating)
  const min = Math.min(...ratings), max = Math.max(...ratings)
  const span = Math.max(40, max - min)
  const x = i => pad + (i / (pts.length - 1)) * (W - 2 * pad)
  const y = r => pad + (1 - (r - min) / span) * (H - 2 * pad)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`
  const up = ratings[ratings.length - 1] >= ratings[0]
  const color = up ? 'var(--success)' : '#e0843c'
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <p className="tiny-label">Rating over time</p>
        <p style={{ fontSize: 12, color }}>{up ? '▲' : '▼'} {ratings[0]} → {ratings[ratings.length - 1]}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <path d={area} fill={color} fillOpacity="0.14" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function Progress({ onNav }) {
  const [stats, setStats] = useState(() => getStats())
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => { setStats(getStats()) }, [])

  const { themeStats } = stats
  const games = stats.games || { wins: 0, losses: 0, draws: 0 }
  const totalGames = games.wins + games.losses + games.draws
  const missedCount = Object.keys(stats.missed || {}).length
  const lessonsDone = Object.keys(stats.lessonsCompleted || {}).length
  const hasData = Object.keys(themeStats).length > 0 || totalGames > 0 || (stats.puzzlesSolved || 0) > 0

  const themeData = ALL_THEMES.map(theme => ({ theme, bucket: themeStats[theme] ?? null, rate: solveRate(themeStats[theme]) }))
  const attempted = themeData.filter(d => d.rate !== null)
  const unattempted = themeData.filter(d => d.rate === null)
  const sorted = [...attempted.slice().sort((a, b) => a.rate - b.rate), ...unattempted]
  const strengths = attempted.filter(d => d.rate >= LEVEL_THRESHOLD).sort((a, b) => b.rate - a.rate)
  const gaps = attempted.filter(d => d.rate < LEVEL_THRESHOLD).sort((a, b) => a.rate - b.rate)
  const rating = stats.rating ?? 800

  // ── Recommended next actions ──────────────────────────────────────────────
  const recs = []
  if (missedCount > 0) recs.push({ tone: 'warning', icon: '↻', title: `Review ${missedCount} missed puzzle${missedCount > 1 ? 's' : ''}`, text: 'Clean these up first — repetition is where the rating gains hide.', cta: 'Review mistakes', target: 'puzzles-review' })
  if (gaps.length) { const w = gaps[0]; recs.push({ tone: 'coach', icon: '🎯', title: `Train ${w.theme}`, text: `Your lowest theme is ${w.theme} at ${Math.round(w.rate * 100)}%. Train this next.`, cta: `Train ${w.theme}`, target: 'puzzles-train' }) }
  if ((stats.streak || 0) > 0) recs.push({ tone: 'good', icon: '🔥', title: `Keep your ${stats.streak}-puzzle streak alive`, text: 'Solve one clean puzzle to keep the momentum going.', cta: 'Daily puzzle', target: 'puzzles' })
  if (!hasData || (lessonsDone < ALL_LESSONS.length && (stats.puzzlesSolved || 0) < 5)) recs.push({ tone: 'info', icon: '🎓', title: 'Build your foundation', text: 'Start with a few lessons and 5 beginner puzzles.', cta: 'Go to lessons', target: 'learn' })

  if (!hasData) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>My Progress</h1>
          <p className="page-subtitle">Track strengths, gaps, and your next goal.</p></div>
        <CoachPanel tone="info" icon="📈" eyebrow="No data yet" title="Let’s get a baseline"
          actions={<>
            <button className="btn-primary" onClick={() => onNav('learn')}>Start lessons</button>
            <button className="btn-secondary" onClick={() => onNav('puzzles')}>Solve puzzles</button>
          </>}>
          Solve a few puzzles and play a game — your rating, streaks, and theme mastery will show up here with a personalised training plan.
        </CoachPanel>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ gap: 24 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>My Progress</h1>
        <p className="page-subtitle">{attempted.length} of {ALL_THEMES.length} themes trained · overall solve rate {attempted.length ? Math.round(attempted.reduce((s, d) => s + d.rate, 0) / attempted.length * 100) : 0}%</p>
      </div>

      {/* Stats */}
      <div className="stat-row">
        <StatCard label="Puzzle rating" value={rating} color="var(--accent)" accent="var(--accent)" />
        <StatCard label="Puzzles solved" value={stats.puzzlesSolved || 0} />
        <StatCard label="🔥 Current streak" value={stats.streak || 0} color="var(--gold)" />
        <StatCard label="Best streak" value={stats.bestStreak || 0} />
        <StatCard label="Engine record" value={<span style={{ fontSize: 18 }}><span style={{ color: 'var(--success)' }}>{games.wins}W</span> <span style={{ color: 'var(--danger)' }}>{games.losses}L</span> <span className="muted">{games.draws}D</span></span>} />
      </div>

      {/* Training plan */}
      {recs.length > 0 && (
        <section>
          <p className="section-title">Training plan — do these next</p>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {recs.slice(0, 3).map((r, i) => (
              <CoachPanel key={i} tone={r.tone} icon={r.icon} title={r.title}
                actions={<button className="btn-primary" onClick={() => onNav(r.target)}>{r.cta} →</button>}>
                {r.text}
              </CoachPanel>
            ))}
          </div>
        </section>
      )}

      <RatingChart history={stats.ratingHistory} />

      {/* Milestone */}
      <section className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p className="tiny-label">Next milestone</p>
          <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, margin: '4px 0 10px' }}>900 Puzzle Rating</p>
          <ProgressBar value={Math.min(rating, 900) - 400} max={500} />
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{rating >= 900 ? '🏆 Reached! Set your sights higher.' : `${900 - rating} rating points to go.`}</p>
        </div>
        <button className="btn-primary" onClick={() => onNav('puzzles-train')}>Train weaknesses →</button>
      </section>

      {/* Strengths & gaps */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div className="panel">
          <p className="section-title" style={{ color: 'var(--success)' }}>Strengths</p>
          {strengths.length ? strengths.slice(0, 5).map(d => (
            <div key={d.theme} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: 'var(--text-soft)' }}>{d.theme}</span><span style={{ color: 'var(--success)', fontWeight: 700 }}>{Math.round(d.rate * 100)}%</span>
            </div>
          )) : <p className="muted" style={{ fontSize: 13 }}>No mastered themes yet — keep training!</p>}
        </div>
        <div className="panel">
          <p className="section-title" style={{ color: 'var(--danger)' }}>Biggest gaps</p>
          {gaps.length ? gaps.slice(0, 5).map(d => (
            <div key={d.theme} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: 'var(--text-soft)' }}>{d.theme}</span><span style={{ color: barColor(d.rate), fontWeight: 700 }}>{Math.round(d.rate * 100)}%</span>
            </div>
          )) : <p className="muted" style={{ fontSize: 13 }}>No weak themes — excellent!</p>}
        </div>
      </div>

      {/* Theme mastery */}
      <section className="panel">
        <p className="section-title">Theme mastery</p>
        {sorted.map(({ theme, bucket, rate }) => <ThemeBar key={theme} theme={theme} bucket={bucket} rate={rate} />)}
      </section>

      {/* Achievements */}
      {(() => {
        const achs = evaluateAchievements(stats)
        const got = achs.filter(a => a.unlocked).length
        return (
          <section>
            <p className="section-title">Achievements · {got} / {achs.length}</p>
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {achs.map(a => (
                <div key={a.id} className="card" style={{ padding: 14, opacity: a.unlocked ? 1 : 0.5, borderColor: a.unlocked ? 'rgba(242,201,76,0.4)' : 'var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 24, filter: a.unlocked ? 'none' : 'grayscale(1)' }} aria-hidden="true">{a.icon}</span>
                    {a.unlocked && <span className="pill pill-gold">✓</span>}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{a.desc}</span>
                </div>
              ))}
            </div>
          </section>
        )
      })()}

      {/* Reset (de-emphasised) */}
      <div>
        {confirmReset ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13 }}>Reset all stats? This can’t be undone.</span>
            <button className="btn-danger" style={{ padding: '6px 14px', minHeight: 36, fontSize: 12 }} onClick={() => { clearStats(); setStats(getStats()); setConfirmReset(false) }}>Yes, reset</button>
            <button className="btn-secondary" style={{ padding: '6px 14px', minHeight: 36, fontSize: 12 }} onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px', minHeight: 36, opacity: 0.6 }} onClick={() => setConfirmReset(true)}>Reset stats</button>
        )}
      </div>
    </div>
  )
}
