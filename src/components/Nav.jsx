import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled, sound } from '../utils/sound.js'

const LINKS = [
  { id: 'learn',    label: 'Learn' },
  { id: 'puzzles',  label: 'Puzzles' },
  { id: 'engine',   label: 'vs Engine' },
  { id: 'openings', label: 'Openings' },
  { id: 'endgames', label: 'Endgames' },
  { id: 'pieces',   label: 'Pieces' },
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

  return (
    <nav style={{
      background: '#16213e',
      borderBottom: '1px solid #2a2a4a',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: '0 8px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      flexShrink: 0,
      minHeight: 52,
    }}>
      {/* Logo / home button */}
      <button
        onClick={() => onNav('home')}
        style={{
          background: 'none',
          color: current === 'home' ? '#4f8ef7' : '#e0e0e0',
          borderBottom: current === 'home' ? '2px solid #4f8ef7' : '2px solid transparent',
          borderRadius: 0,
          padding: '14px 14px',
          fontSize: 16,
          fontWeight: 700,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          minHeight: 52,
          letterSpacing: '-0.01em',
        }}
      >
        ♟ Chess Trainer
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: '#2a2a4a', flexShrink: 0, margin: '0 4px' }} />

      {/* Navigation tabs */}
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
            fontSize: 13,
            fontWeight: current === id ? 700 : 500,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            minHeight: 52,
            transition: 'color 0.15s',
          }}
        >
          {label}
        </button>
      ))}

      {/* Sound toggle + settings, pinned to the right */}
      <button
        onClick={toggleSound}
        title={soundOn ? 'Sound on' : 'Sound off'}
        aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
        style={{
          marginLeft: 'auto',
          background: 'none',
          color: soundOn ? '#4f8ef7' : '#666',
          borderRadius: 0,
          padding: '14px 10px',
          fontSize: 16,
          flexShrink: 0,
          minHeight: 52,
        }}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>
      <button
        onClick={() => onNav('settings')}
        title="Settings"
        aria-label="Settings"
        style={{
          background: 'none',
          color: current === 'settings' ? '#4f8ef7' : '#aaa',
          borderBottom: current === 'settings' ? '2px solid #4f8ef7' : '2px solid transparent',
          borderRadius: 0,
          padding: '14px 12px',
          fontSize: 16,
          flexShrink: 0,
          minHeight: 52,
        }}
      >
        ⚙
      </button>

      {/* Hide scrollbar for Webkit */}
      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
    </nav>
  )
}
