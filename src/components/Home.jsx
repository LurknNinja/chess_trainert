import { useState } from 'react'

const CARDS = [
  { id: 'learn',    icon: '🎓', title: 'Learn Chess',       desc: 'Interactive lessons from your first move to winning tactics.' },
  { id: 'puzzles',  icon: '🧩', title: 'Puzzles & Tactics', desc: 'Sharpen your calculation and earn a puzzle rating.' },
  { id: 'rush',     icon: '⚡', title: 'Puzzle Rush',        desc: 'Race the clock — solve as many as you can in 3 minutes.' },
  { id: 'engine',   icon: '🤖', title: 'Play vs Engine',    desc: 'Play Stockfish with an eval bar, hints, and game review.' },
  { id: 'openings', icon: '📖', title: 'Opening Trainer',   desc: 'Memorise and drill your favourite openings.' },
  { id: 'endgames', icon: '♔',  title: 'Endgame Trainer',   desc: 'Master essential endgame patterns.' },
  { id: 'pieces',   icon: '♞',  title: 'Piece Guide',       desc: 'Learn the role, moves, and power of every piece.' },
  { id: 'glossary', icon: '📚', title: 'Glossary',          desc: 'Look up the chess terms every player should know.' },
  { id: 'progress', icon: '📈', title: 'My Progress',       desc: 'Track your rating, streaks, and theme mastery.' },
]

function HomeCard({ id, icon, title, desc, onNav }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      key={id}
      onClick={() => onNav(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#1e2d52' : '#16213e',
        border: `1px solid ${hovered ? '#4f8ef766' : '#2a2a4a'}`,
        borderRadius: 10,
        padding: 24,
        textAlign: 'left',
        color: '#e0e0e0',
        cursor: 'pointer',
        transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 24px #4f8ef720' : 'none',
        minHeight: 44,
        width: '100%',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#888', fontSize: 13 }}>{desc}</div>
    </button>
  )
}

export default function Home({ onNav }) {
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Chess Trainer</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Pick a mode to get started.</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {CARDS.map(({ id, icon, title, desc }) => (
          <HomeCard key={id} id={id} icon={icon} title={title} desc={desc} onNav={onNav} />
        ))}
      </div>
      <p style={{ color: '#555', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
        Learn · Practice · Play — improve at every level. <span style={{ color: '#4f8ef7' }}>v1.2</span>
      </p>
    </div>
  )
}
