import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { OPENINGS } from '../data/openings.js'
import { playMoveSound, sound } from '../utils/sound.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

function buildPositions(opening) {
  const positions = []
  const g = new Chess()
  // descriptions[i] annotates move i; the start gets a generic label so the
  // final move's note is never dropped.
  positions.push({ fen: g.fen(), description: 'Starting position. Step through the moves →' })
  for (let i = 0; i < opening.moves.length; i++) {
    g.move(uciToMove(opening.moves[i]))
    positions.push({ fen: g.fen(), description: opening.descriptions[i] || '' })
  }
  return positions
}

const START_FEN = new Chess().fen()

export default function Openings() {
  const [openingIdx, setOpeningIdx] = useState(0)
  const [positions, setPositions] = useState(() => buildPositions(OPENINGS[0]))
  const [posIdx, setPosIdx] = useState(0)
  const [mode, setMode] = useState('learn') // learn | drill
  const [drillFen, setDrillFen] = useState(START_FEN)
  const [drillStep, setDrillStep] = useState(0)
  const [drillMsg, setDrillMsg] = useState('')
  const [showArrow, setShowArrow] = useState(false)
  const [trainerThinking, setTrainerThinking] = useState(false)

  const opening = OPENINGS[openingIdx]

  function selectOpening(i) {
    const o = OPENINGS[i]
    setOpeningIdx(i)
    setPositions(buildPositions(o))
    setPosIdx(0)
    setMode('learn')
    setDrillFen(START_FEN)
    setDrillStep(0)
    setDrillMsg('')
    setShowArrow(false)
    setTrainerThinking(false)
  }

  function startDrill() {
    setMode('drill')
    setDrillFen(START_FEN)
    setDrillStep(0)
    setDrillMsg(`You play ${opening.color}.`)
    setShowArrow(false)
    setTrainerThinking(false)
  }

  // Auto-play the trainer's moves whenever it's not the player's turn
  useEffect(() => {
    if (mode !== 'drill') return
    if (drillStep >= opening.moves.length) return
    const g = new Chess(drillFen)
    const playerTurn = opening.color === 'white' ? 'w' : 'b'
    if (g.turn() === playerTurn) return  // player's turn — nothing to do

    // Trainer's turn: play the next move after a short delay
    setTrainerThinking(true)
    const timer = setTimeout(() => {
      const g2 = new Chess(drillFen)
      let tm
      try {
        tm = g2.move(uciToMove(opening.moves[drillStep]))
      } catch {
        setTrainerThinking(false)
        return
      }
      const afterStep = drillStep + 1
      setDrillFen(g2.fen())
      playMoveSound(tm, g2)
      setDrillStep(afterStep)
      setTrainerThinking(false)
      setShowArrow(false)
      if (afterStep >= opening.moves.length) {
        setDrillMsg('✓ Opening complete! Well done.')
      } else {
        setDrillMsg('Your turn — find the right move.')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [mode, drillFen, drillStep, opening])

  const onDrillDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (trainerThinking) return false
    if (drillStep >= opening.moves.length) return false
    const g = new Chess(drillFen)
    const playerTurn = opening.color === 'white' ? 'w' : 'b'
    if (g.turn() !== playerTurn) return false

    const expected = opening.moves[drillStep]
    const uci = sourceSquare + targetSquare
    if (uci !== expected.slice(0, 4)) {
      setDrillMsg(`✗ Wrong! Expected ${expected.slice(0, 2)}→${expected.slice(2, 4)}. Try again.`)
      sound.wrong()
      return false
    }
    const g2 = new Chess(drillFen)
    let pm
    try { pm = g2.move(uciToMove(expected)) } catch { return false }

    const nextStep = drillStep + 1
    setDrillFen(g2.fen())
    playMoveSound(pm, g2)
    setDrillStep(nextStep)
    setShowArrow(false)

    if (nextStep >= opening.moves.length) {
      setDrillMsg('✓ Opening complete! Well done.')
    } else {
      setDrillMsg('✓ Correct!')
    }
    return true
  }, [drillFen, drillStep, opening, trainerThinking])

  // Arrow for learn mode: show next move from current position
  const learnArrow = posIdx < positions.length - 1 && opening.moves[posIdx]
    ? [{ startSquare: opening.moves[posIdx].slice(0, 2), endSquare: opening.moves[posIdx].slice(2, 4), color: '#4f8ef7' }]
    : []

  // Arrow for drill mode: show hint for the player's current expected move
  const playerTurn = opening.color === 'white' ? 'w' : 'b'
  const drillArrow = showArrow && drillStep < opening.moves.length && new Chess(drillFen).turn() === playerTurn
    ? [{ startSquare: opening.moves[drillStep].slice(0, 2), endSquare: opening.moves[drillStep].slice(2, 4), color: '#f0c040' }]
    : []

  if (mode === 'drill') {
    const isDone = drillStep >= opening.moves.length
    return (
      <div>
        <h2 style={{ marginBottom: 4 }}>Opening Trainer · Drill</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{opening.name} · you play {opening.color}</p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 480, maxWidth: '100%' }}>
            <Chessboard
              options={{
                position: drillFen,
                onPieceDrop: onDrillDrop,
                boardOrientation: opening.color,
                animationDurationInMs: 200,
                boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006' },
                allowDragging: !isDone && !trainerThinking,
                arrows: drillArrow,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{drillMsg}</p>
              {trainerThinking && <p style={{ fontSize: 13, color: '#f0c040' }}>Trainer is playing…</p>}
              <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Step {Math.min(drillStep, opening.moves.length)} / {opening.moves.length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={startDrill}>Restart</button>
              <button className="btn-secondary" onClick={() => setMode('learn')}>Back to Learn</button>
              {!isDone && !trainerThinking && (
                <button className="btn-secondary" onClick={() => setShowArrow(h => !h)}>
                  {showArrow ? 'Hide Hint' : 'Hint'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Opening Trainer</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Learn and drill chess openings.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {OPENINGS.map((o, i) => (
          <button key={o.id} onClick={() => selectOpening(i)}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, background: openingIdx === i ? '#4f8ef7' : '#2a2a4a', color: openingIdx === i ? '#fff' : '#aaa' }}>
            {o.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position: positions[posIdx]?.fen,
              boardOrientation: opening.color,
              animationDurationInMs: 200,
              boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006' },
              allowDragging: false,
              arrows: learnArrow,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{opening.name}</p>
            <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>
              {positions[posIdx]?.description}
            </p>
            <p style={{ marginTop: 12, color: '#555', fontSize: 12 }}>Move {posIdx} / {positions.length - 1}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn-secondary" onClick={() => setPosIdx(Math.max(0, posIdx - 1))} disabled={posIdx === 0}>← Prev</button>
            <button className="btn-primary" onClick={() => setPosIdx(Math.min(positions.length - 1, posIdx + 1))} disabled={posIdx === positions.length - 1}>Next →</button>
          </div>
          <button className="btn-success" style={{ width: '100%' }} onClick={startDrill}>
            Drill This Opening
          </button>
        </div>
      </div>
    </div>
  )
}
