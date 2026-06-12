import { useState } from 'react'
import { GLOSSARY, GLOSSARY_CATS } from '../data/glossary.js'

export default function Glossary() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const query = q.trim().toLowerCase()
  const matches = GLOSSARY.filter(g =>
    (cat === 'All' || g.cat === cat) &&
    (!query || g.term.toLowerCase().includes(query) || g.def.toLowerCase().includes(query))
  )
  const cats = ['All', ...GLOSSARY_CATS]

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Chess Glossary</h1>
        <p className="page-subtitle">{GLOSSARY.length} terms every player should know. Search or browse by topic.</p>
      </div>

      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search terms…"
        aria-label="Search glossary"
        style={{
          width: '100%', maxWidth: 380, padding: '11px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
          fontSize: 14, marginBottom: 16, outline: 'none',
        }}
      />

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`pill ${cat === c ? 'pill-blue' : 'pill-muted'}`}
            style={{ minHeight: 32, cursor: 'pointer', fontSize: 12 }} aria-pressed={cat === c}>
            {c}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
        {matches.length} term{matches.length !== 1 ? 's' : ''}{cat !== 'All' ? ` in ${cat}` : ''}{query ? ` matching “${q}”` : ''}
      </p>

      {matches.length === 0 && <p className="muted">No terms match — try a different search.</p>}

      {(cat === 'All' ? GLOSSARY_CATS : [cat]).map(section => {
        const items = matches.filter(g => g.cat === section)
        if (!items.length) return null
        return (
          <section key={section} style={{ marginBottom: 26 }}>
            <p className="section-title" style={{ color: 'var(--accent)' }}>{section}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {items.map(g => (
                <div key={g.term} className="card" style={{ padding: '14px 16px' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>{g.term}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55 }}>{g.def}</p>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
