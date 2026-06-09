import { useState } from 'react'
import { useSettings, setSettings, THEMES } from '../hooks/useSettings.js'
import { isSoundEnabled, setSoundEnabled, sound } from '../utils/sound.js'

function Toggle({ label, desc, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        width: '100%', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10,
        padding: '14px 16px', textAlign: 'left', color: '#e0e0e0', marginBottom: 10,
      }}
    >
      <span>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'block' }}>{label}</span>
        {desc && <span style={{ fontSize: 12, color: '#888' }}>{desc}</span>}
      </span>
      <span style={{
        width: 44, height: 26, borderRadius: 99, flexShrink: 0, position: 'relative',
        background: value ? '#34c37a' : '#2a2a4a', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        }} />
      </span>
    </button>
  )
}

const SPEEDS = [
  { label: 'Off', ms: 0 },
  { label: 'Fast', ms: 120 },
  { label: 'Normal', ms: 200 },
  { label: 'Slow', ms: 350 },
]

export default function Settings() {
  const s = useSettings()
  const [soundOn, setSoundOn] = useState(isSoundEnabled())

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ marginBottom: 6 }}>Settings</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Personalise the board and gameplay. Saved on this device.</p>

      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Board Theme</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {Object.entries(THEMES).map(([key, t]) => (
          <button key={key} onClick={() => setSettings({ theme: key })}
            style={{
              padding: 8, borderRadius: 10, background: '#16213e',
              border: `2px solid ${s.theme === key ? '#4f8ef7' : '#2a2a4a'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
            <span style={{ display: 'grid', gridTemplateColumns: '14px 14px', gridTemplateRows: '14px 14px', borderRadius: 4, overflow: 'hidden' }}>
              <span style={{ background: t.light }} /><span style={{ background: t.dark }} />
              <span style={{ background: t.dark }} /><span style={{ background: t.light }} />
            </span>
            <span style={{ fontSize: 11, color: s.theme === key ? '#4f8ef7' : '#888', fontWeight: 600 }}>{t.name}</span>
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Board Help</h3>
      <Toggle label="Show legal moves" desc="Tap a piece to see where it can move." value={s.showLegalMoves} onChange={v => setSettings({ showLegalMoves: v })} />
      <Toggle label="Highlight last move" desc="Mark the squares of the most recent move." value={s.showLastMove} onChange={v => setSettings({ showLastMove: v })} />
      <Toggle label="Highlight checks" desc="Flag the king when it is in check." value={s.highlightCheck} onChange={v => setSettings({ highlightCheck: v })} />

      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>Animation Speed</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {SPEEDS.map(sp => (
          <button key={sp.ms} onClick={() => setSettings({ animationMs: sp.ms })}
            style={{ padding: '8px 18px', borderRadius: 8, background: s.animationMs === sp.ms ? '#4f8ef7' : '#2a2a4a', color: s.animationMs === sp.ms ? '#fff' : '#aaa', fontWeight: 600 }}>
            {sp.label}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Sound</h3>
      <Toggle label="Sound effects" desc="Moves, captures, checks, and results." value={soundOn}
        onChange={v => { setSoundEnabled(v); setSoundOn(v); if (v) sound.click() }} />
    </div>
  )
}
