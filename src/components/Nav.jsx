import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled, sound } from '../utils/sound.js'

const LINKS = [
  { id: 'learn',    label: 'Learn' },
  { id: 'puzzles',  label: 'Puzzles' },
  { id: 'rush',     label: 'Rush' },
  { id: 'engine',   label: 'Play' },
  { id: 'openings', label: 'Openings' },
  { id: 'endgames', label: 'Endgames' },
  { id: 'pieces',   label: 'Pieces' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'progress', label: 'Progress' },
]

export default function Nav({ current, onNav }) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled())

  function toggleSound() {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) sound.click()
  }

  const tab = (active) => ({
    background: active ? 'rgba(91,157,255,0.16)' : 'none',
    color: active ? '#bcd6ff' : 'var(--muted)',
    border: active ? '1px solid rgba(91,157,255,0.4)' : '1px solid transparent',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    minHeight: 40,
  })

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'linear-gradient(180deg, rgba(13,19,38,0.92), rgba(13,19,38,0.72))',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center',
        gap: 8, padding: '8px 14px', overflowX: 'auto', scrollbarWidth: 'none', minHeight: 56,
      }}>
        {/* Brand */}
        <button onClick={() => onNav('home')}
          style={{ background: 'none', padding: '6px 8px', flexShrink: 0, minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: current === 'home' ? '#bcd6ff' : 'var(--text)', letterSpacing: '-0.02em' }}>
            ♟ Chess Trainer
          </span>
          <span className="nav-tagline" style={{ fontSize: 10, color: 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.04em' }}>Train smarter</span>
        </button>

        <div style={{ width: 1, height: 26, background: 'var(--border)', flexShrink: 0, margin: '0 2px' }} />

        {LINKS.map(({ id, label }) => (
          <button key={id} onClick={() => onNav(id)} style={tab(current === id)} aria-current={current === id ? 'page' : undefined}>
            {label}
          </button>
        ))}

        <button onClick={toggleSound} title={soundOn ? 'Sound on' : 'Sound off'} aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
          style={{ marginLeft: 'auto', background: 'none', color: soundOn ? 'var(--accent)' : 'var(--muted-2)', padding: '8px 10px', fontSize: 16, flexShrink: 0, minHeight: 40 }}>
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button onClick={() => onNav('settings')} title="Settings" aria-label="Settings"
          style={{ background: current === 'settings' ? 'rgba(91,157,255,0.16)' : 'none', color: current === 'settings' ? '#bcd6ff' : 'var(--muted)', borderRadius: 999, padding: '8px 10px', fontSize: 16, flexShrink: 0, minHeight: 40 }}>
          ⚙
        </button>
      </div>
      <style>{`
        nav > div::-webkit-scrollbar { display: none; }
        @media (max-width: 760px) { .nav-tagline { display: none; } }
      `}</style>
    </nav>
  )
}
