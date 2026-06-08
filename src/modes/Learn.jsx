import { useState, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
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
      <div>
        <h2 style={{ marginBottom: 6 }}>Learn Chess</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
          Interactive lessons from your first moves to winning tactics. Play the moves on the board.
        </p>
        <div style={{ height: 6, borderRadius: 4, background: '#1e2a42', overflow: 'hidden', marginBottom: 28, maxWidth: 420 }}>
          <div style={{ width: `${Math.round((completed / total) * 100)}%`, height: '100%', background: '#34c37a', transition: 'width 0.4s' }} />
        </div>
        {LESSON_GROUPS.map(group => (
          <section key={group.level} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, color: '#4f8ef7', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.level}</h3>
            <p style={{ color: '#777', fontSize: 13, marginBottom: 14 }}>{group.blurb}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {group.lessons.map(l => {
                const isDone = !!done[l.id]
                return (
                  <button key={l.id} onClick={() => open(l.id)}
                    style={{
                      background: isDone ? '#13261b' : '#16213e',
                      border: `1px solid ${isDone ? '#34c37a55' : '#2a2a4a'}`,
                      borderRadius: 10, padding: 16, textAlign: 'left', color: '#e0e0e0',
                      display: 'flex', flexDirection: 'column', gap: 6, minHeight: 72,
                    }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {isDone && <span style={{ color: '#34c37a', marginRight: 6 }}>✓</span>}{l.title}
                    </span>
                    <span style={{ fontSize: 11, color: '#777', textTransform: 'capitalize' }}>{l.mode === 'collect' ? 'Movement drill' : 'Guided'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return <LessonView key={lesson.id} lesson={lesson} onBack={back} onComplete={complete} />
}

function LessonView({ lesson, onBack, onComplete }) {
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
      setMsg('Not quite — try the move described above.')
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
  const idx = ALL_LESSONS.findIndex(l => l.id === lesson.id)
  const nextLesson = ALL_LESSONS[idx + 1]

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', color: '#888', padding: '4px 0', marginBottom: 8, minHeight: 0 }}>← All lessons</button>
      <h2 style={{ marginBottom: 2 }}>{lesson.title}</h2>
      <p style={{ color: '#666', fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lesson.level} · {isCollect ? 'Movement' : 'Guided lesson'}</p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 440, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position,
              onPieceDrop: onDrop,
              boardOrientation: 'white',
              animationDurationInMs: 200,
              boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006' },
              squareStyles,
              allowDragging: !done && !busy,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            background: msgKind === 'good' ? '#13261b' : msgKind === 'bad' ? '#2a1414' : '#16213e',
            border: `1px solid ${msgKind === 'good' ? '#34c37a55' : msgKind === 'bad' ? '#e0545455' : '#2a2a4a'}`,
            borderRadius: 10, padding: 18, marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: msgKind === 'bad' ? '#f0a0a0' : '#e0e0e0' }}>{msg}</p>
            {isCollect && !done && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>Targets left: {remaining.size}</p>
            )}
            {!isCollect && !done && (
              <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>Step {stepIdx + 1} of {lesson.steps.length}</p>
            )}
          </div>
          {done && (
            <div style={{ marginBottom: 16, padding: 14, background: '#13261b', borderRadius: 10, border: '1px solid #34c37a55' }}>
              <p style={{ color: '#34c37a', fontWeight: 700, fontSize: 14 }}>✓ Lesson complete!</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={reset}>Restart</button>
            {done && (
              <button className="btn-primary" onClick={onBack}>
                {nextLesson ? 'Back to lessons →' : 'Finish →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
