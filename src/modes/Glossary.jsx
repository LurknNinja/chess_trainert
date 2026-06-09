import { useState } from 'react'
import { GLOSSARY, GLOSSARY_CATS } from '../data/glossary.js'

export default function Glossary() {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const matches = GLOSSARY.filter(g =>
    !query || g.term.toLowerCase().includes(query) || g.def.toLowerCase().includes(query)
  )

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 6 }}>Chess Glossary</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        {GLOSSARY.length} terms every player should know. Search or browse by topic.
      </p>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search terms…"
        style={{
          width: '100%', maxWidth: 360, padding: '10px 14px', borderRadius: 8,
          background: '#16213e', border: '1px solid #2a2a4a', color: '#e0e0e0',
          fontSize: 14, marginBottom: 24, outline: 'none',
        }}
      />

      {matches.length === 0 && <p style={{ color: '#666' }}>No terms match “{q}”.</p>}

      {GLOSSARY_CATS.map(cat => {
        const items = matches.filter(g => g.cat === cat)
        if (!items.length) return null
        return (
          <section key={cat} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 13, color: '#4f8ef7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{cat}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(g => (
                <div key={g.term} style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#e0e0e0' }}>{g.term}</p>
                  <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.55 }}>{g.def}</p>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
