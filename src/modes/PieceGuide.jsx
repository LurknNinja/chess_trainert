import { useState } from 'react'
import { PIECES } from '../data/pieces.js'

// Common beginner mistakes + which movement lesson practices each piece.
const BEGINNER_MISTAKES = {
  king:   'Leaving the king in the centre. Castle early to tuck it safely away.',
  queen:  'Bringing the queen out too early, where it gets chased and loses time.',
  rook:   'Developing rooks late. They only shine on open files and ranks.',
  bishop: 'Trapping a bishop behind its own pawns instead of giving it open diagonals.',
  knight: 'Parking a knight on the rim, where it controls far fewer squares — “a knight on the rim is dim”.',
  pawn:   'Pushing too many pawns early and forgetting to develop pieces.',
}
const PRACTICE_LESSON = { rook: 'The Rook', bishop: 'The Bishop', queen: 'The Queen', knight: 'The Knight' }

// ── Movement diagram ────────────────────────────────────────────────────────
function MovementDiagram({ grid, accentColor }) {
  const cellSize = 36

  return (
    <div style={{
      display: 'inline-grid',
      gridTemplateColumns: `repeat(5, ${cellSize}px)`,
      gridTemplateRows: `repeat(5, ${cellSize}px)`,
      gap: 3,
      background: '#0d1117',
      borderRadius: 8,
      padding: 6,
      border: '1px solid #2a2a4a',
    }}>
      {grid.map((row, r) =>
        row.map((cell, c) => {
          let bg = '#1e1e32'           // 0 = empty
          let content = null

          if (cell === 2) {            // piece
            bg = '#fff'
          } else if (cell === 1) {     // reachable
            bg = accentColor
          }

          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                background: bg,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cell === 0 ? 0.35 : 1,
                transition: 'background 0.2s',
              }}
            >
              {content}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Stat bar ────────────────────────────────────────────────────────────────
function StatBar({ label, value, max = 9, color }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, background: '#1e1e32', borderRadius: 99, overflow: 'hidden', border: '1px solid #2a2a4a' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 99,
          transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  )
}

// ── Single piece card ────────────────────────────────────────────────────────
function PieceCard({ piece, onNav }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${piece.color}40`,
      borderRadius: 'var(--radius-lg)',
      padding: '28px 26px',
      maxWidth: 480,
      width: '100%',
      margin: '0 auto',
      boxShadow: `0 14px 44px ${piece.color}1f`,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{
          fontSize: 72,
          lineHeight: 1,
          color: piece.color,
          filter: `drop-shadow(0 0 12px ${piece.color}66)`,
          flexShrink: 0,
          userSelect: 'none',
        }}>
          {piece.symbol}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#f0f0f0' }}>{piece.name}</h2>
          <p style={{ color: piece.color, fontSize: 14, fontWeight: 600, margin: '4px 0 8px', letterSpacing: '0.02em' }}>{piece.tagline}</p>
          <p style={{ color: '#888', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{piece.moveDesc}</p>
        </div>
      </div>

      {/* Movement diagram + stats side by side */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>Movement</p>
          <MovementDiagram grid={piece.movement} accentColor={piece.color} />
        </div>
        <div style={{ flex: 1, minWidth: 140, paddingTop: 20 }}>
          <StatBar label="Power" value={piece.stats.power} color={piece.color} />
          <StatBar label="Speed" value={piece.stats.speed} color={piece.color} />
          <StatBar label="Range" value={piece.stats.range} color={piece.color} />
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 12, color: '#34c37a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Strengths</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {piece.strengths.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>
                <span style={{ color: '#34c37a', flexShrink: 0, fontWeight: 700 }}>✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 12, color: '#e05454', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Weaknesses</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {piece.weaknesses.map((w, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>
                <span style={{ color: '#e05454', flexShrink: 0, fontWeight: 700 }}>✗</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Power Move */}
      <div style={{
        background: `linear-gradient(135deg, ${piece.color}15, ${piece.color}08)`,
        border: `1px solid ${piece.color}44`,
        borderRadius: 10,
        padding: '16px 18px',
      }}>
        <p style={{ fontSize: 11, color: piece.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
          ⚡ Power Move
        </p>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#f0f0f0', marginBottom: 6 }}>{piece.powerMove.name}</p>
        <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, margin: 0 }}>{piece.powerMove.desc}</p>
      </div>

      {/* Common beginner mistake */}
      <div style={{ background: 'rgba(224,84,84,0.08)', border: '1px solid rgba(224,84,84,0.3)', borderRadius: 10, padding: '14px 16px' }}>
        <p className="tiny-label" style={{ color: 'var(--danger)', marginBottom: 6 }}>Common beginner mistake</p>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>{BEGINNER_MISTAKES[piece.id]}</p>
      </div>

      {/* Practice CTA */}
      <button className={PRACTICE_LESSON[piece.id] ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%' }} onClick={() => onNav('learn')}>
        {PRACTICE_LESSON[piece.id] ? `Practice: ${PRACTICE_LESSON[piece.id]} drill →` : 'Practice in Lessons →'}
      </button>
    </div>
  )
}

// ── Piece selector thumbnails ────────────────────────────────────────────────
function PieceThumb({ piece, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${piece.color}22` : '#16213e',
        border: `2px solid ${active ? piece.color : '#2a2a4a'}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        transition: 'all 0.18s',
        minWidth: 60,
        outline: 'none',
      }}
      title={piece.name}
    >
      <span style={{
        fontSize: 28,
        color: active ? piece.color : '#888',
        filter: active ? `drop-shadow(0 0 6px ${piece.color}88)` : 'none',
        transition: 'all 0.18s',
        lineHeight: 1,
      }}>
        {piece.symbol}
      </span>
      <span style={{ fontSize: 10, color: active ? piece.color : '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {piece.name}
      </span>
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PieceGuide({ onNav }) {
  const [idx, setIdx] = useState(0)

  function prev() { setIdx(i => (i - 1 + PIECES.length) % PIECES.length) }
  function next() { setIdx(i => (i + 1) % PIECES.length) }

  const piece = PIECES[idx]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Piece Guide</h1>
        <p className="page-subtitle">Learn the role, moves, and tactical power of every chess piece.</p>
      </div>

      {/* Piece thumbnail selector */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 28,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'thin',
      }}>
        {PIECES.map((p, i) => (
          <PieceThumb key={p.id} piece={p} active={i === idx} onClick={() => setIdx(i)} />
        ))}
      </div>

      {/* Card + navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={prev}
          style={{
            background: '#16213e',
            border: '1px solid #2a2a4a',
            color: '#aaa',
            borderRadius: 10,
            width: 44,
            height: 44,
            fontSize: 18,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a2a4a'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#16213e'; e.currentTarget.style.color = '#aaa' }}
          title="Previous piece"
        >
          ←
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <PieceCard piece={piece} key={piece.id} onNav={onNav} />
        </div>

        <button
          onClick={next}
          style={{
            background: '#16213e',
            border: '1px solid #2a2a4a',
            color: '#aaa',
            borderRadius: 10,
            width: 44,
            height: 44,
            fontSize: 18,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a2a4a'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#16213e'; e.currentTarget.style.color = '#aaa' }}
          title="Next piece"
        >
          →
        </button>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        {PIECES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIdx(i)}
            style={{
              width: i === idx ? 24 : 8,
              height: 8,
              borderRadius: 99,
              background: i === idx ? piece.color : '#2a2a4a',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            title={p.name}
          />
        ))}
      </div>

      {/* Piece counter */}
      <p style={{ textAlign: 'center', color: '#555', fontSize: 12, marginTop: 12 }}>
        {idx + 1} / {PIECES.length}
      </p>
    </div>
  )
}
