import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { OPENINGS } from '../data/openings.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

function buildPositions(opening) {
  const positions = []
  const g = new Chess()
  positions.push({ fen: g.fen(), description: opening.descriptions[0] })
  for (let i = 0; i < opening.moves.length; i++) {
    g.move(uciToMove(opening.moves[i]))
    positions.push({ fen: g.fen(), description: opening.descriptions[i + 1] || '' })
  }
  return positions
}

export default function Openings() {
  const [openingIdx, setOpeningIdx] = useState(0)
  const [positions, setPositions] = useState(() => buildPositions(OPENINGS[0]))
  const [posIdx, setPosIdx] = useState(0)
  const [mode, setMode] = useState('learn') // learn | drill
  const [drillGame, setDrillGame] = useState(null)
  const [drillStep, setDrillStep] = useState(0)
  const [drillMsg, setDrillMsg] = useState('')

  const opening = OPENINGS[openingIdx]

  function selectOpening(i) {
    const o = OPENINGS[i]
    setOpeningIdx(i)
    setPositions(buildPositions(o))
    setPosIdx(0)
    setMode('learn')
    setDrillGame(null)
    setDrillStep(0)
    setDrillMsg('')
  }

  function startDrill() {
    setMode('drill')
    setDrillGame(new Chess())
    setDrillStep(0)
    setDrillMsg(`Play move ${Math.ceil(1 / 1)}: ${opening.color === 'white' ? 'You play White' : 'You play Black'}`)
  }

  const onDrillDrop = useCallback((from, to) => {
    if (!drillGame) return false
    const expected = opening.moves[drillStep]
    const uci = from + to
    if (uci !== expected.slice(0, 4)) {
      setDrillMsg(`✗ Wrong! Expected ${expected}. Try again.`)
      return false
    }
    const g = new Chess(drillGame.fen())
    g.move(uciToMove(expected))
    const nextStep = drillStep + 1

    if (nextStep >= opening.moves.length) {
      setDrillGame(g)
      setDrillStep(nextStep)
      setDrillMsg('✓ Opening complete! Well done.')
      return true
    }

    // Play next move automatically if it's the "other" side
    const playerColor = opening.color
    const playerTurn = playerColor === 'white' ? 'w' : 'b'
    const afterTurn = g.turn()

    setDrillGame(g)
    setDrillStep(nextStep)

    if (afterTurn !== playerTurn) {
      // Play opponent's move
      setTimeout(() => {
        const opponentUci = opening.moves[nextStep]
        const g2 = new Chess(g.fen())
        g2.move(uciToMove(opponentUci))
        setDrillGame(g2)
        setDrillStep(nextStep + 1)
        if (nextStep + 1 >= opening.moves.length) {
          setDrillMsg('✓ Opening complete! Well done.')
        } else {
          setDrillMsg(`✓ Correct! Now play move ${Math.floor((nextStep + 1) / 2) + 1}...`)
        }
      }, 500)
    } else {
      setDrillMsg(`✓ Correct! Continue…`)
    }
    return true
  }, [drillGame, drillStep, opening])

  if (mode === 'drill' && drillGame) {
    return (
      <div>
        <h2 style={{ marginBottom: 4 }}>Opening Trainer · Drill</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{opening.name} · you play {opening.color}</p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 480, maxWidth: '100%' }}>
            <Chessboard
              position={drillGame.fen()}
              onPieceDrop={onDrillDrop}
              boardOrientation={opening.color}
              customBoardStyle={{ borderRadius: 8, boxShadow: '0 4px 24px #0006' }}
              arePiecesDraggable={drillStep < opening.moves.length}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{drillMsg}</p>
              <p style={{ fontSize: 13, color: '#666' }}>
                Step {Math.min(drillStep, opening.moves.length)} / {opening.moves.length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={startDrill}>Restart Drill</button>
              <button className="btn-secondary" onClick={() => setMode('learn')}>Back to Learn</button>
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
            position={positions[posIdx]?.fen}
            boardOrientation={opening.color}
            customBoardStyle={{ borderRadius: 8, boxShadow: '0 4px 24px #0006' }}
            arePiecesDraggable={false}
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
