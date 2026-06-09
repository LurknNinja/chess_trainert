import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { PUZZLES as LOCAL_PUZZLES } from '../data/puzzles.js'
import { recordAttempt, getStats } from '../hooks/useStats.js'
import { sound } from '../utils/sound.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

function isLegalUci(fen, uci) {
  try {
    new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' })
    return true
  } catch { return false }
}

async function fetchLichessDaily() {
  try {
    const res = await fetch('https://lichess.org/api/puzzle/daily', {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const { puzzle, game } = data

    if (!puzzle.solution?.length) return null

    const full = new Chess()
    full.loadPgn(game.pgn)
    const verboseMoves = full.history({ verbose: true })
    if (verboseMoves.length < puzzle.initialPly) return null

    const g = new Chess()
    for (let i = 0; i < puzzle.initialPly; i++) {
      const m = verboseMoves[i]
      g.move({ from: m.from, to: m.to, promotion: m.promotion })
    }

    const sol0 = puzzle.solution[0]
    let finalFen = g.fen()

    if (!isLegalUci(finalFen, sol0)) {
      // Some Lichess puzzles: initialPly is one short — advance one more move
      if (verboseMoves.length > puzzle.initialPly) {
        const extra = verboseMoves[puzzle.initialPly]
        g.move({ from: extra.from, to: extra.to, promotion: extra.promotion })
        finalFen = g.fen()
        if (!isLegalUci(finalFen, sol0)) return null
      } else {
        return null
      }
    }

    return {
      id: 'lichess-daily',
      theme: (puzzle.themes?.[0] ?? 'tactics').replace(/([A-Z])/g, ' $1').trim(),
      fen: finalFen,
      moves: puzzle.solution,
      rating: puzzle.rating ?? 1500,
      description: `Lichess Daily Puzzle · ${puzzle.rating ?? '?'} rating`,
      daily: true,
    }
  } catch {
    return null
  }
}

function getWeakThemes(threshold = 0.6) {
  const { themeStats } = getStats()
  return Object.entries(themeStats)
    .filter(([, s]) => s.attempts > 0 && s.solved / s.attempts < threshold)
    .sort(([, a], [, b]) => (a.solved / a.attempts) - (b.solved / b.attempts))
    .map(([theme]) => theme)
}

export default function Puzzles({ onNav, initialTrainMode = false }) {
  const [puzzles, setPuzzles] = useState(LOCAL_PUZZLES)
  const [dailyStatus, setDailyStatus] = useState('loading')
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(LOCAL_PUZZLES[0].fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [trainMode, setTrainMode] = useState(initialTrainMode)
  const [playerStats, setPlayerStats] = useState(() => getStats())
  const [ratingDelta, setRatingDelta] = useState(null)

  // Per-puzzle session tracking (refs so they don't trigger re-renders)
  const hadWrongMove = useRef(false)
  const hintsUsedCount = useRef(0)
  const attemptFired = useRef(false)
  // Keep current index/puzzle accessible in callbacks without stale closures
  const idxRef = useRef(idx)
  idxRef.current = idx
  const puzzlesRef = useRef(puzzles)
  puzzlesRef.current = puzzles

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

  function fireAttempt(theme, solved, puzzleRating) {
    if (attemptFired.current || !theme) return
    const updated = recordAttempt(theme, {
      solved,
      firstTry: !hadWrongMove.current,
      hintsUsed: hintsUsedCount.current,
      puzzleRating,
    })
    attemptFired.current = true
    setPlayerStats(updated)
    if (typeof updated._lastDelta === 'number') setRatingDelta(updated._lastDelta)
  }

  function loadPuzzle(i, list) {
    const allPuzzles = list ?? puzzlesRef.current
    const isReset = i === idxRef.current && !list
    // Record outgoing attempt as failed if user made at least one wrong move but didn't solve
    if (!isReset && !attemptFired.current && hadWrongMove.current) {
      const outgoing = allPuzzles[idxRef.current]
      fireAttempt(outgoing?.theme, false, outgoing?.rating)
    }
    hadWrongMove.current = false
    hintsUsedCount.current = 0
    attemptFired.current = false
    setIdx(i)
    setFen(allPuzzles[i].fen)
    setMoveIdx(0)
    setStatus('idle')
    setMessage('')
    setHintLevel(0)
    setRatingDelta(null)
  }

  useEffect(() => {
    if (dailyStatus === 'ok') loadPuzzle(0, puzzles)
  }, [dailyStatus]) // eslint-disable-line

  function pickNext() {
    const allPuzzles = puzzlesRef.current
    if (!trainMode) {
      const next = Math.min(idxRef.current + 1, allPuzzles.length - 1)
      loadPuzzle(next)
      return
    }
    const weak = getWeakThemes(0.6)
    const pool = weak.length
      ? allPuzzles.filter(p => !p.daily && weak.includes(p.theme))
      : allPuzzles
    const candidates = pool.length ? pool : allPuzzles
    const byTheme = {}
    candidates.forEach(p => { (byTheme[p.theme] ??= []).push(p) })
    const targetTheme = weak.find(t => byTheme[t]?.length) ?? candidates[0].theme
    const group = byTheme[targetTheme] ?? candidates
    const next = group[Math.floor(Math.random() * group.length)]
    const nextIdx = allPuzzles.indexOf(next)
    loadPuzzle(nextIdx !== -1 ? nextIdx : 0)
  }

  const onDrop = useCallback(({ sourceSquare, targetSquare, piece }) => {
    if (!puzzle) return false
    const expected = puzzle.moves[moveIdx]
    if (!expected) return false
    // piece is a plain string like 'wP' in react-chessboard v5
    const uci = sourceSquare + targetSquare + (piece === 'wP' && targetSquare[1] === '8' ? 'q' : piece === 'bP' && targetSquare[1] === '1' ? 'q' : '')
    const g = new Chess(fen)
    try {
      g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }

    if (uci.slice(0, 4) !== expected.slice(0, 4)) {
      hadWrongMove.current = true
      setMessage('✗ Wrong move — try again.')
      setStatus('wrong')
      sound.wrong()
      return false
    }

    const newFen = g.fen()
    setFen(newFen)
    setHintLevel(0)
    const nextMoveIdx = moveIdx + 1

    if (nextMoveIdx >= puzzle.moves.length) {
      setStatus('solved')
      setMessage('✓ Puzzle solved!')
      sound.win()
      fireAttempt(puzzle.theme, true, puzzle.rating)
      return true
    }

    // Correct intermediate move — play a cue, then auto-play the opponent reply.
    if (g.isCheck()) sound.check(); else if (g.history({ verbose: true })[0]?.captured) sound.capture(); else sound.correct()

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Puzzles &amp; Tactics</h2>
        {trainMode && (
          <span style={{ fontSize: 11, background: '#1a3a1a', color: '#34c37a', border: '1px solid #34c37a55', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
            ⚡ WEAKNESS FOCUS
          </span>
        )}
      </div>
      <p style={{ color: '#888', marginBottom: 14, fontSize: 14 }}>
        {puzzle.daily
          ? <span style={{ color: '#f0c040' }}>★ Daily Puzzle</span>
          : <>Puzzle {idx + (dailyStatus === 'ok' ? 0 : 1)} of {puzzles.length - (dailyStatus === 'ok' ? 1 : 0)}</>
        }
        {' · '}<strong style={{ color: '#4f8ef7' }}>{puzzle.theme}</strong>
        {typeof puzzle.rating === 'number' && <span style={{ color: '#666' }}> · rated {puzzle.rating}</span>}
      </p>

      {/* Rating + streak strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#16213e', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>YOUR RATING</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#4f8ef7' }}>{playerStats.rating}</span>
          {ratingDelta !== null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: ratingDelta >= 0 ? '#34c37a' : '#e05454' }}>
              {ratingDelta >= 0 ? '+' : ''}{ratingDelta}
            </span>
          )}
        </div>
        <div style={{ background: '#16213e', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>🔥 STREAK</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#f0c040' }}>{playerStats.streak || 0}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: orientation,
              animationDurationInMs: 200,
              boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006', aspectRatio: '1 / 1', height: 'auto', gridTemplateRows: 'repeat(8, 1fr)' },
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
              <button className="btn-secondary" onClick={() => { setHintLevel(h => h + 1); hintsUsedCount.current += 1 }}>
                {hintLevel === 0 ? 'Hint: show piece' : 'Hint: show target'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className="btn-secondary" onClick={() => loadPuzzle(idx)}>Reset</button>
            {idx > 0 && <button className="btn-secondary" onClick={() => loadPuzzle(idx - 1)}>← Prev</button>}
            <button className="btn-primary" onClick={pickNext} disabled={!trainMode && idx >= puzzles.length - 1}>
              Next →
            </button>
          </div>

          <button
            onClick={() => setTrainMode(t => !t)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: trainMode ? '#1a3a1a' : '#2a2a4a',
              color: trainMode ? '#34c37a' : '#aaa',
              border: `1px solid ${trainMode ? '#34c37a55' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {trainMode ? '⚡ Training Weaknesses — click to stop' : 'Train My Weaknesses'}
          </button>

          <div style={{ marginTop: 20 }}>
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
