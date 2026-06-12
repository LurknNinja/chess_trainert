import { getStats } from '../hooks/useStats.js'
import { ALL_LESSONS } from '../data/lessons.js'
import CoachPanel from './CoachPanel.jsx'
import StatCard from './StatCard.jsx'

const MODES = [
  { id: 'learn',    icon: '🎓', title: 'Learn Chess',     desc: 'Interactive lessons and guided board drills.',        badge: 'All levels', action: 'Start learning' },
  { id: 'puzzles',  icon: '🧩', title: 'Puzzles',         desc: 'Build tactical vision with rated puzzles.',           badge: 'Rated',      action: 'Solve puzzles' },
  { id: 'rush',     icon: '⚡', title: 'Puzzle Rush',      desc: 'Fast tactics under pressure — beat your best.',       badge: '3 min',      action: 'Start rush' },
  { id: 'engine',   icon: '🤖', title: 'Play vs Engine',  desc: 'Play Stockfish, then review your mistakes.',          badge: '5 bots',     action: 'Play a game' },
  { id: 'threats',  icon: '🛡️', title: 'Find the Threat', desc: 'Spot your opponent’s plan before it lands.',          badge: 'Defense',    action: 'Train defense' },
  { id: 'openings', icon: '📖', title: 'Openings',        desc: 'Understand the plans, not just memorised moves.',     badge: '10 lines',   action: 'Study openings' },
  { id: 'endgames', icon: '♔',  title: 'Endgames',        desc: 'Practice essential winning and drawing technique.',   badge: 'Technique',  action: 'Train endgames' },
  { id: 'pieces',   icon: '♞',  title: 'Piece Guide',     desc: 'Learn what every piece wants.',                       badge: 'Basics',     action: 'Open guide' },
  { id: 'glossary', icon: '📚', title: 'Glossary',        desc: 'Decode chess terms without the Latin headache.',      badge: 'Reference',  action: 'Browse terms' },
  { id: 'progress', icon: '📈', title: 'My Progress',     desc: 'See strengths, gaps, and your next goal.',            badge: 'Insights',   action: 'View progress' },
]

function weakestTheme(themeStats) {
  let worst = null
  for (const [theme, s] of Object.entries(themeStats || {})) {
    if (!s.attempts) continue
    const rate = s.solved / s.attempts
    if (!worst || rate < worst.rate) worst = { theme, rate, attempts: s.attempts }
  }
  return worst
}

// Decide the single most useful next action for the player.
function recommend(stats) {
  const missed = Object.keys(stats.missed || {}).length
  const lessonsDone = Object.keys(stats.lessonsCompleted || {}).length
  const solved = stats.puzzlesSolved || 0
  const worst = weakestTheme(stats.themeStats)

  if (solved === 0 && lessonsDone === 0) {
    return { tone: 'coach', eyebrow: 'Start here', title: 'Build your foundation',
      text: 'New here? Begin with a few quick lessons, then solve 5 beginner puzzles to warm up your tactics.',
      cta: 'Start the beginner path', target: 'learn' }
  }
  if (missed > 0) {
    return { tone: 'warning', eyebrow: 'Recommended next', title: `Review ${missed} missed puzzle${missed > 1 ? 's' : ''}`,
      text: 'Clean up the puzzles you got wrong before starting new ones — repetition is where the rating gains hide.',
      cta: 'Review mistakes', target: 'puzzles-review' }
  }
  if (worst && worst.rate < 0.75) {
    return { tone: 'coach', eyebrow: 'Recommended next', title: `Train ${worst.theme}`,
      text: `Your weakest theme is ${worst.theme} at ${Math.round(worst.rate * 100)}%. A focused set here moves the needle fastest.`,
      cta: `Train ${worst.theme}`, target: 'puzzles-train' }
  }
  if (lessonsDone < ALL_LESSONS.length) {
    return { tone: 'info', eyebrow: 'Recommended next', title: 'Continue your lessons',
      text: `You've finished ${lessonsDone} of ${ALL_LESSONS.length} lessons. Keep the momentum going with the next one.`,
      cta: 'Continue learning', target: 'learn' }
  }
  return { tone: 'good', eyebrow: 'Recommended next', title: 'Solve the daily puzzle',
    text: 'You\'re on top of your weaknesses. Keep sharp with today\'s puzzle and a coach game.',
    cta: 'Daily puzzle', target: 'puzzles' }
}

function ModeCard({ m, onNav }) {
  return (
    <button className="mode-card" onClick={() => onNav(m.id)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="icon" aria-hidden="true">{m.icon}</span>
        <span className="pill pill-muted">{m.badge}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{m.title}</div>
      <div className="muted" style={{ fontSize: 13, flex: 1 }}>{m.desc}</div>
      <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{m.action} →</span>
    </button>
  )
}

export default function Home({ onNav }) {
  const stats = getStats()
  const rec = recommend(stats)
  const games = stats.games || { wins: 0, losses: 0, draws: 0 }
  const missed = Object.keys(stats.missed || {}).length

  return (
    <div className="dashboard-grid" style={{ gap: 24 }}>
      {/* Hero */}
      <section className="hero">
        <h1>Train smarter. Play better.</h1>
        <p>Your daily chess coach for tactics, openings, endgames, and game review.</p>
        <div className="button-row" style={{ marginTop: 20 }}>
          <button className="btn-primary" style={{ padding: '12px 22px', fontSize: 15 }} onClick={() => onNav(rec.target)}>
            Start today's training
          </button>
          {missed > 0 && (
            <button className="btn-gold" onClick={() => onNav('puzzles-review')}>Review mistakes ({missed})</button>
          )}
          <button className="btn-ghost" onClick={() => onNav('engine')}>Play a coach game</button>
        </div>
      </section>

      {/* Recommended next */}
      <CoachPanel
        tone={rec.tone}
        eyebrow={rec.eyebrow}
        title={rec.title}
        icon="🎯"
        actions={<button className="btn-primary" onClick={() => onNav(rec.target)}>{rec.cta} →</button>}
      >
        {rec.text}
      </CoachPanel>

      {/* Quick stats */}
      <section>
        <p className="section-title">Your numbers</p>
        <div className="stat-row">
          <StatCard label="Puzzle rating" value={stats.rating ?? 800} color="var(--accent)" accent="var(--accent)" />
          <StatCard label="🔥 Current streak" value={stats.streak || 0} color="var(--gold)" />
          <StatCard label="Best streak" value={stats.bestStreak || 0} />
          <StatCard label="Puzzles solved" value={stats.puzzlesSolved || 0} />
          <StatCard label="Engine record"
            value={<span style={{ fontSize: 20 }}><span style={{ color: 'var(--success)' }}>{games.wins}W</span> <span style={{ color: 'var(--danger)' }}>{games.losses}L</span> <span className="muted">{games.draws}D</span></span>} />
        </div>
      </section>

      {/* Modes */}
      <section>
        <p className="section-title">Training modes</p>
        <div className="mode-grid">
          {MODES.map(m => <ModeCard key={m.id} m={m} onNav={onNav} />)}
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Learn · Practice · Play — improve at every level. <span style={{ color: 'var(--accent)' }}>v1.5</span>
      </p>
    </div>
  )
}
