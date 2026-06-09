import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import { PUZZLES } from '../data/puzzles.js'
import { recordRush, getStats } from '../hooks/useStats.js'
import { sound } from '../utils/sound.js'

const DURATION = 180 // seconds
const MAX_STRIKES = 3

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

// Puzzles ordered easiest-first so the run ramps up in difficulty.
const QUEUE = PUZZLES.filter(p => !p.daily).slice().sort((a, b) => (a.rating || 1000) - (b.rating || 1000))

function fmtTime(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function PuzzleRush({ onNav }) {
  const [phase, setPhase] = useState('ready') // ready | playing | over
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [qIdx, setQIdx] = useState(0)
  const [fen, setFen] = useState(QUEUE[0].fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [flash, setFlash] = useState(null) // 'good' | 'bad'
  const [best, setBest] = useState(() => getStats().rushBest || 0)

  const qIdxRef = useRef(0)
  const moveIdxRef = useRef(0)
  const fenRef = useRef(fen)
  fenRef.current = fen
  moveIdxRef.current = moveIdx

  const puzzle = QUEUE[qIdx % QUEUE.length]

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { endRun(); return }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft]) // eslint-disable-line

  function start() {
    setScore(0); setStrikes(0); setTimeLeft(DURATION)
    setQIdx(0); qIdxRef.current = 0
    setFen(QUEUE[0].fen); setMoveIdx(0)
    setFlash(null)
    setPhase('playing')
    sound.click()
  }

  function endRun() {
    setPhase('over')
    const updated = recordRush(score)
    setBest(updated.rushBest)
    sound.lose()
  }

  const loadNext = useCallback((nextScore, nextStrikes) => {
    if (nextStrikes >= MAX_STRIKES) { setPhase('over'); const u = recordRush(nextScore); setBest(u.rushBest); sound.lose(); return }
    const ni = qIdxRef.current + 1
    qIdxRef.current = ni
    setQIdx(ni)
    setFen(QUEUE[ni % QUEUE.length].fen)
    setMoveIdx(0)
  }, [])

  const onDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (phase !== 'playing') return false
    const p = QUEUE[qIdxRef.current % QUEUE.length]
    const expected = p.moves[moveIdxRef.current]
    if (!expected) return false
    const g = new Chess(fenRef.current)
    try { g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }

    if ((sourceSquare + targetSquare) !== expected.slice(0, 4)) {
      // Wrong → strike, flash, next puzzle.
      sound.wrong()
      setFlash('bad'); setTimeout(() => setFlash(null), 300)
      setStrikes(s => { const ns = s + 1; loadNext(score, ns); return ns })
      return false
    }

    const newFen = g.fen()
    setFen(newFen)
    const next = moveIdxRef.current + 1
    if (next >= p.moves.length) {
      // Solved.
      sound.correct()
      setFlash('good'); setTimeout(() => setFlash(null), 250)
      setScore(s => { const ns = s + 1; loadNext(ns, strikes); return ns })
      return true
    }
    // Auto-play opponent reply, continue same puzzle.
    setMoveIdx(next)
    setTimeout(() => {
      const g2 = new Chess(newFen)
      try { g2.move(uciToMove(p.moves[next])) } catch { return }
      setFen(g2.fen())
      setMoveIdx(next + 1)
    }, 250)
    return true
  }, [phase, score, strikes, loadNext])

  if (phase === 'ready') {
    return (
      <div>
        <h2 style={{ marginBottom: 6 }}>Puzzle Rush ⚡</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24, maxWidth: 460 }}>
          Solve as many puzzles as you can in <strong style={{ color: '#e0e0e0' }}>3 minutes</strong>. They get harder as you go.
          Three wrong moves and the run is over. How high can you score?
        </p>
        <div style={{ background: '#16213e', borderRadius: 10, padding: 24, maxWidth: 320 }}>
          <p style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 4 }}>BEST SCORE</p>
          <p style={{ fontSize: 40, fontWeight: 800, color: '#f0c040', marginBottom: 20 }}>{best}</p>
          <button className="btn-success" style={{ width: '100%', padding: 12, fontSize: 15 }} onClick={start}>Start Rush</button>
        </div>
      </div>
    )
  }

  if (phase === 'over') {
    const isRecord = score >= best && score > 0
    return (
      <div>
        <h2 style={{ marginBottom: 16 }}>Puzzle Rush ⚡</h2>
        <div style={{ background: '#16213e', borderRadius: 10, padding: 32, maxWidth: 360, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{timeLeft <= 0 ? "Time's up!" : 'Run over'}</p>
          <p style={{ fontSize: 56, fontWeight: 800, color: '#4f8ef7', lineHeight: 1 }}>{score}</p>
          <p style={{ fontSize: 13, color: '#888', margin: '8px 0 20px' }}>
            {isRecord ? <span style={{ color: '#f0c040', fontWeight: 700 }}>🏆 New best!</span> : `Best: ${best}`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-success" style={{ flex: 1, padding: 12 }} onClick={start}>Play Again</button>
            <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => onNav('puzzles')}>Puzzles</button>
          </div>
        </div>
      </div>
    )
  }

  const orientation = puzzle.fen.includes(' b ') ? 'black' : 'white'
  const lowTime = timeLeft <= 30

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Puzzle Rush ⚡</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: '#16213e', borderRadius: 8, padding: '8px 16px' }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>SCORE </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#4f8ef7' }}>{score}</span>
        </div>
        <div style={{ background: '#16213e', borderRadius: 8, padding: '8px 16px' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: lowTime ? '#e05454' : '#e0e0e0', fontFamily: 'monospace' }}>{fmtTime(timeLeft)}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ fontSize: 20, opacity: i < strikes ? 1 : 0.25 }}>❌</span>
          ))}
        </div>
      </div>
      <div style={{ width: 480, maxWidth: '100%', outline: flash === 'good' ? '3px solid #34c37a' : flash === 'bad' ? '3px solid #e05454' : 'none', borderRadius: 10, transition: 'outline 0.1s' }}>
        <Board position={fen} orientation={orientation} onDrop={onDrop} allowDragging id="rush" />
      </div>
      <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
        {orientation === 'white' ? 'White' : 'Black'} to move · <span style={{ color: '#4f8ef7' }}>{puzzle.theme}</span>
      </p>
    </div>
  )
}
