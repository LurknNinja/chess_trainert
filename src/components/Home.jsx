const CARDS = [
  { id: 'puzzles',  icon: '🧩', title: 'Puzzles & Tactics', desc: 'Sharpen your calculation with curated puzzles.' },
  { id: 'engine',   icon: '🤖', title: 'Play vs Engine',    desc: 'Test yourself against Stockfish at any level.' },
  { id: 'openings', icon: '📖', title: 'Opening Trainer',   desc: 'Memorise and drill your favourite openings.' },
  { id: 'endgames', icon: '♔',  title: 'Endgame Trainer',   desc: 'Master essential endgame patterns.' },
]

export default function Home({ onNav }) {
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Chess Trainer</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Pick a mode to get started.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
        {CARDS.map(({ id, icon, title, desc }) => (
          <button
            key={id}
            onClick={() => onNav(id)}
            style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 24, textAlign: 'left', color: '#e0e0e0' }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
            <div style={{ color: '#888', fontSize: 13 }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
