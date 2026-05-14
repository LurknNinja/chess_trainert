const LINKS = [
  { id: 'home',     label: '♟ Chess Trainer' },
  { id: 'puzzles',  label: 'Puzzles' },
  { id: 'engine',   label: 'vs Engine' },
  { id: 'openings', label: 'Openings' },
  { id: 'endgames', label: 'Endgames' },
]

export default function Nav({ current, onNav }) {
  return (
    <nav style={{ background: '#16213e', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexWrap: 'wrap' }}>
      {LINKS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onNav(id)}
          style={{
            background: 'none',
            color: current === id ? '#4f8ef7' : '#aaa',
            borderBottom: current === id ? '2px solid #4f8ef7' : '2px solid transparent',
            borderRadius: 0,
            padding: '14px 12px',
            fontSize: id === 'home' ? 17 : 14,
            fontWeight: id === 'home' ? 700 : 500,
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
