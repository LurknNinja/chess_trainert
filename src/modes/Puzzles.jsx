import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { PUZZLES } from '../data/puzzles.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

export default function Puzzles() {
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(PUZZLES[0].fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [hintLevel, setHintLevel] = useState(0)

  const puzzle = PUZZLES[idx]

  function loadPuzzle(i) {
    setIdx(i)
    setFen(PUZZLES[i].fen)
    setMoveIdx(0)
    setStatus('idle')
    setMessage('')
    setHintLevel(0)
  }

  const onDrop = useCallback((sourceSquare, targetSquare, piece) => {
    const expected = puzzle.moves[moveIdx]
    const uci = sourceSquare + targetSquare + (piece === 'wP' && targetSquare[1] === '8' ? 'q' : piece === 'bP' && targetSquare[1] === '1' ? 'q' : '')
    const g = new Chess(fen)
    try {
      g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }

    if (uci.slice(0, 4) !== expected.slice(0, 4)) {
      setMessage('✗ Wrong move — try again.')
      setStatus('wrong')
      return false
    }

    const newFen = g.fen()
    setFen(newFen)
    setHintLevel(0)
    const nextMoveIdx = moveIdx + 1

    if (nextMoveIdx >= puzzle.moves.length) {
      setStatus('solved')
      setMessage('✓ Puzzle solved!')
      return true
    }

    // Play opponent response
    setTimeout(() => {
      const g2 = new Chess(newFen)
      g2.move(uciToMove(puzzle.moves[nextMoveIdx]))
      setFen(g2.fen())
      setMoveIdx(nextMoveIdx + 1)
      setStatus('idle')
      setMessage('')
    }, 400)

    setMoveIdx(nextMoveIdx)
    return true
  }, [fen, moveIdx, puzzle])

  const correctMove = puzzle.moves[moveIdx] || ''
  const hintSquares = {}
  if (hintLevel >= 1 && correctMove) {
    hintSquares[correctMove.slice(0, 2)] = { background: 'rgba(255, 200, 0, 0.55)', borderRadius: '50%' }
  }
  if (hintLevel >= 2 && correctMove) {
    hintSquares[correctMove.slice(2, 4)] = { background: 'rgba(255, 200, 0, 0.35)', borderRadius: '50%' }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Puzzles & Tactics</h2>
      <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
        Puzzle {idx + 1} of {PUZZLES.length} · <strong style={{ color: '#4f8ef7' }}>{puzzle.theme}</strong>
      </p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={puzzle.fen.includes(' b ') ? 'black' : 'white'}
            animationDuration={200}
            customBoardStyle={{ borderRadius: 8, boxShadow: '0 4px 24px #0006' }}
            customSquareStyles={hintSquares}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ marginBottom: 8, color: '#ccc' }}>{puzzle.description}</p>
            {message && (
              <p style={{ marginTop: 12, fontWeight: 700, color: status === 'solved' ? '#34c37a' : status === 'wrong' ? '#e05454' : '#4f8ef7' }}>
                {message}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {status !== 'solved' && hintLevel < 2 && (
              <button className="btn-secondary" onClick={() => setHintLevel(h => h + 1)}>
                {hintLevel === 0 ? 'Hint: show piece' : 'Hint: show target'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => loadPuzzle(idx)}>Reset</button>
            {idx > 0 && <button className="btn-secondary" onClick={() => loadPuzzle(idx - 1)}>← Prev</button>}
            {idx < PUZZLES.length - 1 && (
              <button className="btn-primary" onClick={() => loadPuzzle(idx + 1)}>Next →</button>
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>All puzzles</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PUZZLES.map((p, i) => (
                <button key={p.id} onClick={() => loadPuzzle(i)}
                  style={{ padding: '4px 10px', fontSize: 12, background: i === idx ? '#4f8ef7' : '#2a2a4a', color: i === idx ? '#fff' : '#aaa', borderRadius: 4 }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
