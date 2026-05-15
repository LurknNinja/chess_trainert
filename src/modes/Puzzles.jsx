import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { PUZZLES as LOCAL_PUZZLES } from '../data/puzzles.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

async function fetchLichessDaily() {
  try {
    const res = await fetch('https://lichess.org/api/puzzle/daily', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const { puzzle, game } = data

    // Replay PGN up to initialPly to get the starting FEN
    const full = new Chess()
    full.loadPgn(game.pgn)
    const allMoves = full.history()
    const g = new Chess()
    for (let i = 0; i < puzzle.initialPly; i++) g.move(allMoves[i])

    return {
      id: 'lichess-daily',
      theme: (puzzle.themes?.[0] ?? 'tactics').replace(/([A-Z])/g, ' $1').trim(),
      fen: g.fen(),
      moves: puzzle.solution,
      description: `Lichess Daily Puzzle · ${puzzle.rating ?? '?'} rating`,
      daily: true,
    }
  } catch {
    return null
  }
}

export default function Puzzles() {
  const [puzzles, setPuzzles] = useState(LOCAL_PUZZLES)
  const [dailyStatus, setDailyStatus] = useState('loading') // loading | ok | error
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(LOCAL_PUZZLES[0].fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [hintLevel, setHintLevel] = useState(0)

  useEffect(() => {
    fetchLichessDaily().then(p => {
      if (p) {
        setPuzzles(prev => [p, ...prev])
        setDailyStatus('ok')
      } else {
        setDailyStatus('error')
      }
    })
  }, [])

  const puzzle = puzzles[idx]

  function loadPuzzle(i, list = puzzles) {
    setIdx(i)
    setFen(list[i].fen)
    setMoveIdx(0)
    setStatus('idle')
    setMessage('')
    setHintLevel(0)
  }

  // When daily puzzle loads, it's prepended — shift idx if user hasn't moved yet
  useEffect(() => {
    if (dailyStatus === 'ok' && idx === 0) loadPuzzle(0, puzzles)
  }, [dailyStatus]) // eslint-disable-line

  const onDrop = useCallback(({ sourceSquare, targetSquare, piece }) => {
    if (!puzzle) return false
    const expected = puzzle.moves[moveIdx]
    const pieceType = piece?.pieceType ?? ''
    const uci = sourceSquare + targetSquare + (pieceType === 'wP' && targetSquare[1] === '8' ? 'q' : pieceType === 'bP' && targetSquare[1] === '1' ? 'q' : '')
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

  if (!puzzle) return null

  const correctMove = puzzle.moves[moveIdx] || ''
  const hintSquares = {}
  if (hintLevel >= 1 && correctMove) {
    hintSquares[correctMove.slice(0, 2)] = { background: 'rgba(255, 200, 0, 0.55)', borderRadius: '50%' }
  }
  if (hintLevel >= 2 && correctMove) {
    hintSquares[correctMove.slice(2, 4)] = { background: 'rgba(255, 200, 0, 0.35)', borderRadius: '50%' }
  }
  const hintArrow = hintLevel >= 1 && correctMove && status !== 'solved'
    ? [{ startSquare: correctMove.slice(0, 2), endSquare: correctMove.slice(2, 4), color: 'rgba(255, 200, 0, 0.8)' }]
    : []

  const orientation = puzzle.fen.includes(' b ') ? 'black' : 'white'

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Puzzles & Tactics</h2>
      <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
        {puzzle.daily
          ? <span style={{ color: '#f0c040' }}>★ Daily Puzzle</span>
          : <>Puzzle {idx + (dailyStatus === 'ok' ? 0 : 1)} of {puzzles.length - (dailyStatus === 'ok' ? 1 : 0)}</>
        }
        {' · '}<strong style={{ color: '#4f8ef7' }}>{puzzle.theme}</strong>
      </p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: orientation,
              animationDurationInMs: 200,
              boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006' },
              squareStyles: hintSquares,
              arrows: hintArrow,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            {puzzle.daily && (
              <p style={{ fontSize: 11, color: '#f0c040', marginBottom: 8, fontWeight: 600 }}>LICHESS DAILY</p>
            )}
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
            {idx < puzzles.length - 1 && (
              <button className="btn-primary" onClick={() => loadPuzzle(idx + 1)}>Next →</button>
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {dailyStatus === 'loading' ? 'Loading daily puzzle…' : `${puzzles.length} puzzles`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {puzzles.map((p, i) => (
                <button key={p.id} onClick={() => loadPuzzle(i)}
                  style={{
                    padding: '4px 10px', fontSize: 12, borderRadius: 4,
                    background: i === idx ? '#4f8ef7' : p.daily ? '#3a2a0a' : '#2a2a4a',
                    color: i === idx ? '#fff' : p.daily ? '#f0c040' : '#aaa',
                    border: p.daily ? '1px solid #f0c04044' : '1px solid transparent',
                  }}>
                  {p.daily ? '★' : i + (dailyStatus === 'ok' ? 0 : 1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
