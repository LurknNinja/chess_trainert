import { useState, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { LESSON_GROUPS, ALL_LESSONS } from '../data/lessons.js'
import { recordLesson, getStats } from '../hooks/useStats.js'
import { sound, playMoveSound } from '../utils/sound.js'

// ── Single-piece move generator (collect mode, kingless boards) ──────────────
const FILES = 'abcdefgh'
const sqName = (f, r) => FILES[f] + (r + 1)
const parseSq = (s) => ({ f: FILES.indexOf(s[0]), r: +s[1] - 1 })
const DIR = {
  R: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  B: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
}
DIR.Q = [...DIR.R, ...DIR.B]
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]

function pieceMoves(type, from, occupied) {
  const { f, r } = parseSq(from)
  const out = new Set()
  if (type === 'N') {
    for (const [df, dr] of KNIGHT) {
      const nf = f + df, nr = r + dr
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) out.add(sqName(nf, nr))
    }
    return out
  }
  for (const [df, dr] of DIR[type]) {
    let nf = f + df, nr = r + dr
    while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      const s = sqName(nf, nr)
      out.add(s)
      if (occupied.has(s)) break // stop at (and allow capturing) the first blocker
      nf += df; nr += dr
    }
  }
  return out
}

// ── FEN placement <-> map helpers (collect mode) ─────────────────────────────
function fenToMap(fen) {
  const map = {}
  const rows = fen.split(' ')[0].split('/')
  for (let r = 0; r < 8; r++) {
    let f = 0
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) { f += +ch; continue }
      const square = FILES[f] + (8 - r)
      const code = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase()
      map[square] = code
      f++
    }
  }
  return map
}
function mapToFen(map) {
  let rows = []
  for (let r = 8; r >= 1; r--) {
    let row = '', empty = 0
    for (let f = 0; f < 8; f++) {
      const code = map[FILES[f] + r]
      if (!code) { empty++; continue }
      if (empty) { row += empty; empty = 0 }
      const letter = code[1]
      row += code[0] === 'w' ? letter : letter.toLowerCase()
    }
    if (empty) row += empty
    rows.push(row || '8')
  }
  return rows.join('/') + ' w - - 0 1'
}

const dot = (color) => ({ background: `radial-gradient(circle, ${color} 28%, transparent 30%)` })

export default function Learn() {
  const [stats, setStats] = useState(() => getStats())
  const [lessonId, setLessonId] = useState(null)

  const lesson = ALL_LESSONS.find(l => l.id === lessonId) || null

  function open(id) { setLessonId(id); sound.click() }
  function back() { setLessonId(null); setStats(getStats()) }
  function complete(id) {
    setStats(recordLesson(id))
  }

  if (!lesson) {
    const done = stats.lessonsCompleted || {}
    const total = ALL_LESSONS.length
    const completed = Object.keys(done).filter(k => ALL_LESSONS.some(l => l.id === k)).length
    return (
      <div className="dashboard-grid" style={{ gap: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Learn Chess</h1>
          <p className="page-subtitle">A guided path from your first moves to winning tactics — play every idea on the board.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, maxWidth: 460 }}>
            <div style={{ flex: 1 }}><ProgressBar value={completed} max={total} color="var(--success)" /></div>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{completed} / {total} done</span>
          </div>
        </div>
        {LESSON_GROUPS.map(group => (
          <section key={group.level}>
            <p className="section-title" style={{ color: 'var(--accent)' }}>{group.level}</p>
            <p className="muted" style={{ fontSize: 13, margin: '-6px 0 14px' }}>{group.blurb}</p>
            <div className="mode-grid">
              {group.lessons.map(l => {
                const isDone = !!done[l.id]
                return (
                  <button key={l.id} className="mode-card" onClick={() => open(l.id)} style={isDone ? { borderColor: 'rgba(52,195,122,0.4)' } : undefined}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`pill ${l.mode === 'collect' ? 'pill-blue' : 'pill-muted'}`}>{l.mode === 'collect' ? 'Movement drill' : 'Guided'}</span>
                      {isDone
                        ? <span className="pill pill-green">✓ Complete</span>
                        : <span className="pill pill-muted">Start</span>}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{l.title}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return <LessonView key={lesson.id} lesson={lesson} onBack={back} onComplete={complete} onOpen={open} />
}

function LessonView({ lesson, onBack, onComplete, onOpen }) {
  const isCollect = lesson.mode === 'collect'

  // ── Collect-mode state ─────────────────────────────────────────────────────
  const [boardMap, setBoardMap] = useState(() => fenToMap(lesson.fen))
  const [piecePos, setPiecePos] = useState(lesson.piece)
  const [remaining, setRemaining] = useState(() => new Set(lesson.targets || []))

  // ── Sequence-mode state ────────────────────────────────────────────────────
  // Only sequence lessons use chess.js; collect lessons run on kingless boards
  // (which chess.js rejects), so guard the instantiation.
  const gameRef = useRef(undefined)
  if (gameRef.current === undefined) gameRef.current = isCollect ? null : new Chess(lesson.fen)
  const [fen, setFen] = useState(lesson.fen)
  const [stepIdx, setStepIdx] = useState(0)
  const [busy, setBusy] = useState(false)

  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState(lesson.intro)
  const [msgKind, setMsgKind] = useState('info') // info | good | bad
  const completedRef = useRef(false)

  function finish() {
    if (completedRef.current) return
    completedRef.current = true
    setDone(true)
    setMsg(lesson.success)
    setMsgKind('good')
    sound.win()
    onComplete(lesson.id)
  }

  // ── Collect drop ───────────────────────────────────────────────────────────
  const collectDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (done || sourceSquare !== piecePos) return false
    const moverCode = boardMap[piecePos]
    if (!moverCode) return false
    const type = moverCode[1] // R/B/Q/N
    const occupied = new Set(Object.keys(boardMap).filter(s => s !== piecePos))
    if (!pieceMoves(type, piecePos, occupied).has(targetSquare)) {
      setMsg('That is not a legal move for this piece. Try again.')
      setMsgKind('bad'); sound.wrong()
      return false
    }
    const captured = !!boardMap[targetSquare]
    const next = { ...boardMap }
    delete next[piecePos]
    next[targetSquare] = moverCode
    setBoardMap(next)
    setPiecePos(targetSquare)
    if (captured) sound.capture(); else sound.move()

    if (remaining.has(targetSquare)) {
      const rem = new Set(remaining); rem.delete(targetSquare)
      setRemaining(rem)
      if (rem.size === 0) { finish() }
      else { setMsg(`Good — ${rem.size} target${rem.size > 1 ? 's' : ''} to go.`); setMsgKind('good') }
    }
    return true
  }, [boardMap, piecePos, remaining, done]) // eslint-disable-line

  // ── Sequence drop ──────────────────────────────────────────────────────────
  const sequenceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (done || busy) return false
    const step = lesson.steps[stepIdx]
    if (!step) return false
    const want = step.move
    const tried = sourceSquare + targetSquare
    if (tried !== want.slice(0, 4)) {
      setMsg('Not quite. Read the instruction again and look for the piece that matches the idea.')
      setMsgKind('bad'); sound.wrong()
      return false
    }
    const g = gameRef.current
    let m
    try { m = g.move({ from: sourceSquare, to: targetSquare, promotion: want[4] || 'q' }) }
    catch { return false }
    setFen(g.fen())
    playMoveSound(m, g)

    const advance = () => {
      const nextIdx = stepIdx + 1
      if (nextIdx >= lesson.steps.length) { finish(); return }
      setStepIdx(nextIdx)
      setMsg(lesson.steps[nextIdx].instruction)
      setMsgKind('info')
    }

    if (step.reply) {
      setBusy(true)
      setMsg(step.explain || 'Correct!')
      setMsgKind('good')
      setTimeout(() => {
        try {
          const rm = g.move({ from: step.reply.slice(0, 2), to: step.reply.slice(2, 4), promotion: step.reply[4] || 'q' })
          setFen(g.fen()); playMoveSound(rm, g)
        } catch { /* ignore */ }
        setBusy(false)
        advance()
      }, 650)
    } else {
      setMsg(step.explain || 'Correct!')
      setMsgKind('good')
      setTimeout(advance, 200)
    }
    return true
  }, [done, busy, stepIdx, lesson]) // eslint-disable-line

  function reset() {
    completedRef.current = false
    setDone(false)
    setMsg(lesson.intro); setMsgKind('info')
    if (isCollect) {
      setBoardMap(fenToMap(lesson.fen))
      setPiecePos(lesson.piece)
      setRemaining(new Set(lesson.targets))
    } else {
      gameRef.current = new Chess(lesson.fen)
      setFen(lesson.fen); setStepIdx(0); setBusy(false)
    }
    sound.click()
  }

  // Highlights
  const squareStyles = {}
  if (isCollect) {
    remaining.forEach(sq => { squareStyles[sq] = dot('rgba(52,195,122,0.9)') })
    if (!done) squareStyles[piecePos] = { boxShadow: 'inset 0 0 0 3px rgba(79,142,247,0.8)' }
  }

  const position = isCollect ? mapToFen(boardMap) : fen
  const onDrop = isCollect ? collectDrop : sequenceDrop
  // In collect mode the board is kingless, so feed legal-move dots from our own
  // single-piece generator instead of chess.js.
  const getLegalTargets = isCollect
    ? (square) => {
        if (square !== piecePos) return []
        const code = boardMap[piecePos]
        if (!code) return []
        const occ = new Set(Object.keys(boardMap).filter(s => s !== piecePos))
        return [...pieceMoves(code[1], piecePos, occ)]
      }
    : undefined
  const idx = ALL_LESSONS.findIndex(l => l.id === lesson.id)
  const nextLesson = ALL_LESSONS[idx + 1]

  const stepMax = isCollect ? (lesson.targets?.length || 1) : lesson.steps.length
  const stepNow = done ? stepMax : isCollect ? (stepMax - remaining.size) : stepIdx

  return (
    <div>
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 12, padding: '6px 12px', minHeight: 36 }}>← All lessons</button>
      <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)', marginBottom: 2 }}>{lesson.title}</h1>
      <p className="tiny-label" style={{ marginBottom: 16 }}>{lesson.level} · {isCollect ? 'Movement drill' : 'Guided lesson'}</p>
      <div className="layout-two-col">
        <div className="layout-board">
          <Board position={position} orientation="white" onDrop={onDrop} allowDragging={!done && !busy} squareStyles={squareStyles} getLegalTargets={getLegalTargets} id="learn" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}><ProgressBar value={stepNow} max={stepMax} color={done ? 'var(--success)' : undefined} /></div>
            <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {isCollect ? `${remaining.size} target${remaining.size !== 1 ? 's' : ''} left` : `Step ${Math.min(stepIdx + 1, stepMax)} / ${stepMax}`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CoachPanel
            tone={done ? 'good' : msgKind === 'bad' ? 'bad' : msgKind === 'good' ? 'good' : 'info'}
            icon={done ? '🎉' : msgKind === 'bad' ? '💡' : '♟'}
            eyebrow={done ? 'Lesson complete' : msgKind === 'bad' ? 'Try again' : 'Your move'}>
            <p>{msg}</p>
          </CoachPanel>
          <div className="button-row">
            <button className="btn-secondary" onClick={reset}>Restart</button>
            {done && nextLesson && <button className="btn-primary" onClick={() => onOpen(nextLesson.id)}>Next lesson →</button>}
            {done && !nextLesson && <button className="btn-primary" onClick={onBack}>Finish →</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
