import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
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

// ── Coaching content: per-theme fallback hints when a puzzle has no custom ones ──
const THEME_HINTS = {
  'Fork':                 { concept: 'Look for a move that attacks two targets at once.', forcing: 'Checks and knight moves are the most common fork starters.', pattern: 'A fork wins material because one piece creates two threats at the same time.' },
  'Pin':                  { concept: 'Look for an enemy piece that cannot safely move.', forcing: 'Bishops, rooks, and queens create pins along a line.', pattern: 'A pinned piece is stuck — pile more attackers onto it or exploit the square it guards.' },
  'Skewer':               { concept: 'Attack the more valuable piece so it must move.', forcing: 'A check often forces the king to step aside and expose the piece behind it.', pattern: 'A skewer is a pin in reverse: the valuable piece is in front.' },
  'Back Rank':            { concept: 'Look at the enemy king’s escape squares — or lack of them.', forcing: 'A rook or queen check on the back rank may be decisive.', pattern: 'A king trapped behind its own pawns is mated on the back rank.' },
  'Discovered Attack':    { concept: 'Move one piece to unleash an attack from the piece behind it.', forcing: 'The moving piece can create a second threat at the same time.', pattern: 'Discovered attacks hit two things at once — the mover and the unmasked piece.' },
  'Discovered Check':     { concept: 'Move a piece to reveal a check from the piece behind it.', forcing: 'While giving check, the moving piece can grab something for free.', pattern: 'Discovered checks are brutal: the opponent must answer the check first.' },
  'Double Attack':        { concept: 'Find a single move that makes two threats.', forcing: 'Centralised queens and forking knights do this best.', pattern: 'Two threats, one move — the opponent can only answer one.' },
  'Checkmate in 1':       { concept: 'The king has no safe square if you give the right check.', forcing: 'List every checking move, then test each one.', pattern: 'Mate needs check + no escape + no defence.' },
  'Checkmate in 2':       { concept: 'Find a forcing first move that strips the king’s shelter.', forcing: 'Start with the most forcing check or sacrifice.', pattern: 'Force the king into a box, then deliver mate.' },
  'Smothered Mate':       { concept: 'The king is boxed in by its own pieces — a knight can finish it.', forcing: 'A queen sacrifice often clears the way for Nf7/Ng6 mate.', pattern: 'Smothered mate: the king is trapped by its own army.' },
  'Promotion':            { concept: 'Push the pawn home and pick the right piece.', forcing: 'A promotion with check is often the cleanest win.', pattern: 'A passed pawn on the 7th rank is worth more than it looks.' },
  'Trapped Piece':        { concept: 'Find an enemy piece with no safe squares.', forcing: 'Attack it with a smaller piece so it can’t escape.', pattern: 'A trapped piece is as good as won material.' },
  'Removing the Defender':{ concept: 'Identify the piece holding the position together, then remove it.', forcing: 'Capture or deflect the key defender.', pattern: 'Take out the guard and the target falls.' },
  'Queen Sacrifice':      { concept: 'Sometimes the queen is worth giving up — for mate.', forcing: 'Look for forced checks that follow the sacrifice.', pattern: 'A sacrifice is only sound if the follow-up is forcing.' },
  'Zwischenzug':          { concept: 'Before the “obvious” recapture, look for an in-between move.', forcing: 'A check or bigger threat can be inserted first.', pattern: 'Zwischenzug — squeeze in a threat before doing the expected thing.' },
}
const DEFAULT_HINT = { concept: 'Scan for checks, captures, and threats.', forcing: 'Forcing moves narrow the search — start there.', pattern: 'Always look at the most forcing move first.' }

function coachFor(puzzle) {
  const base = THEME_HINTS[puzzle.theme] || DEFAULT_HINT
  return {
    concept: puzzle.conceptHint || base.concept,
    forcing: puzzle.forcingHint || base.forcing,
    pattern: puzzle.pattern || base.pattern,
    explanation: puzzle.explanation || `Classic ${puzzle.theme}. ${puzzle.pattern || base.pattern}`,
  }
}

const HINT_LABELS = ['Hint: the idea', 'Hint: forcing move', 'Hint: which piece', 'Hint: target square', 'Show the move']
const WRONG_MSGS = [
  'Not quite — that move is legal, but it doesn’t solve the tactic.',
  'Keep looking. What is the most forcing move in the position?',
  'Try scanning checks, captures, and threats before quiet moves.',
]

async function fetchLichessDaily() {
  try {
    const res = await fetch('https://lichess.org/api/puzzle/daily', { headers: { Accept: 'application/json' } })
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
      if (verboseMoves.length > puzzle.initialPly) {
        const extra = verboseMoves[puzzle.initialPly]
        g.move({ from: extra.from, to: extra.to, promotion: extra.promotion })
        finalFen = g.fen()
        if (!isLegalUci(finalFen, sol0)) return null
      } else return null
    }
    return {
      id: 'lichess-daily',
      theme: (puzzle.themes?.[0] ?? 'tactics').replace(/([A-Z])/g, ' $1').trim(),
      fen: finalFen, moves: puzzle.solution, rating: puzzle.rating ?? 1500,
      description: 'Today’s puzzle from Lichess.', daily: true,
    }
  } catch { return null }
}

function getWeakThemes(threshold = 0.6) {
  const { themeStats } = getStats()
  return Object.entries(themeStats)
    .filter(([, s]) => s.attempts > 0 && s.solved / s.attempts < threshold)
    .sort(([, a], [, b]) => (a.solved / a.attempts) - (b.solved / b.attempts))
    .map(([theme]) => theme)
}

export default function Puzzles({ onNav, initialTrainMode = false, initialReviewMode = false }) {
  const [puzzles, setPuzzles] = useState(LOCAL_PUZZLES)
  const [dailyStatus, setDailyStatus] = useState('loading')
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(LOCAL_PUZZLES[0].fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [status, setStatus] = useState('idle')   // idle | wrong | solved
  const [message, setMessage] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [trainMode, setTrainMode] = useState(initialTrainMode)
  const [reviewMode, setReviewMode] = useState(initialReviewMode)
  const [playerStats, setPlayerStats] = useState(() => getStats())
  const [ratingDelta, setRatingDelta] = useState(null)

  const hadWrongMove = useRef(false)
  const hintsUsedCount = useRef(0)
  const wrongCount = useRef(0)
  const attemptFired = useRef(false)
  const idxRef = useRef(idx); idxRef.current = idx
  const puzzlesRef = useRef(puzzles); puzzlesRef.current = puzzles

  useEffect(() => {
    fetchLichessDaily().then(p => {
      if (p) { setPuzzles(prev => [p, ...prev]); setDailyStatus('ok') }
      else setDailyStatus('error')
    })
  }, [])

  // Kick off review mode if we arrived via "Review Mistakes".
  useEffect(() => {
    if (initialReviewMode) setTimeout(() => pickNextReview(), 0)
  }, []) // eslint-disable-line

  const puzzle = puzzles[idx]

  function fireAttempt(theme, solved, puzzleRating, puzzleId) {
    if (attemptFired.current || !theme) return
    const updated = recordAttempt(theme, { solved, firstTry: !hadWrongMove.current, hintsUsed: hintsUsedCount.current, puzzleRating, puzzleId })
    attemptFired.current = true
    setPlayerStats(updated)
    if (typeof updated._lastDelta === 'number') setRatingDelta(updated._lastDelta)
  }

  function loadPuzzle(i, list) {
    const allPuzzles = list ?? puzzlesRef.current
    const isReset = i === idxRef.current && !list
    if (!isReset && !attemptFired.current && hadWrongMove.current) {
      const outgoing = allPuzzles[idxRef.current]
      fireAttempt(outgoing?.theme, false, outgoing?.rating, outgoing?.id)
    }
    hadWrongMove.current = false
    hintsUsedCount.current = 0
    wrongCount.current = 0
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
    if (dailyStatus === 'ok' && !reviewMode) loadPuzzle(0, puzzles)
  }, [dailyStatus]) // eslint-disable-line

  function pickNextReview() {
    const allPuzzles = puzzlesRef.current
    const missed = getStats().missed || {}
    const pool = allPuzzles.filter(p => !p.daily && missed[p.id])
    if (!pool.length) { setReviewMode(false); pickNext(); return }
    const next = pool[Math.floor(Math.random() * pool.length)]
    loadPuzzle(allPuzzles.indexOf(next))
  }

  function pickNext() {
    const allPuzzles = puzzlesRef.current
    if (reviewMode) { pickNextReview(); return }
    if (!trainMode) { loadPuzzle(Math.min(idxRef.current + 1, allPuzzles.length - 1)); return }
    const weak = getWeakThemes(0.6)
    const pool = weak.length ? allPuzzles.filter(p => !p.daily && weak.includes(p.theme)) : allPuzzles
    const candidates = pool.length ? pool : allPuzzles
    const byTheme = {}
    candidates.forEach(p => { (byTheme[p.theme] ??= []).push(p) })
    const targetTheme = weak.find(t => byTheme[t]?.length) ?? candidates[0].theme
    const group = byTheme[targetTheme] ?? candidates
    const next = group[Math.floor(Math.random() * group.length)]
    const nextIdx = allPuzzles.indexOf(next)
    loadPuzzle(nextIdx !== -1 ? nextIdx : 0)
  }

  function trainSameTheme() {
    const all = puzzlesRef.current
    const pool = all.filter(p => !p.daily && p.theme === puzzle.theme && p.id !== puzzle.id)
    if (!pool.length) { pickNext(); return }
    const next = pool[Math.floor(Math.random() * pool.length)]
    loadPuzzle(all.indexOf(next))
  }

  function useHint() {
    setHintLevel(h => Math.min(5, h + 1))
    hintsUsedCount.current += 1
    sound.click()
  }

  const onDrop = useCallback(({ sourceSquare, targetSquare, piece }) => {
    if (!puzzle) return false
    const expected = puzzle.moves[moveIdx]
    if (!expected) return false
    const uci = sourceSquare + targetSquare + (piece === 'wP' && targetSquare[1] === '8' ? 'q' : piece === 'bP' && targetSquare[1] === '1' ? 'q' : '')
    const g = new Chess(fen)
    try { g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }

    if (uci.slice(0, 4) !== expected.slice(0, 4)) {
      hadWrongMove.current = true
      const base = WRONG_MSGS[Math.min(wrongCount.current, WRONG_MSGS.length - 1)]
      wrongCount.current += 1
      setMessage(hintLevel === 0 ? `${base} Stuck? Tap a hint.` : base)
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
      setMessage('')
      sound.win()
      fireAttempt(puzzle.theme, true, puzzle.rating, puzzle.id)
      return true
    }

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
  }, [fen, moveIdx, puzzle, hintLevel])

  if (!puzzle) return null

  const c = coachFor(puzzle)
  const correctMove = puzzle.moves[moveIdx] || ''
  const hintSquares = {}
  if (hintLevel >= 3 && correctMove) hintSquares[correctMove.slice(0, 2)] = { background: 'rgba(242,201,76,0.55)', borderRadius: '50%' }
  if (hintLevel >= 4 && correctMove) hintSquares[correctMove.slice(2, 4)] = { background: 'rgba(242,201,76,0.35)', borderRadius: '50%' }
  const hintArrow = hintLevel >= 5 && correctMove && status !== 'solved'
    ? [{ startSquare: correctMove.slice(0, 2), endSquare: correctMove.slice(2, 4), color: 'rgba(242,201,76,0.85)' }]
    : []
  const orientation = puzzle.fen.includes(' b ') ? 'black' : 'white'
  const missedCount = Object.keys(playerStats.missed || {}).length
  const turnLabel = orientation === 'white' ? 'White to move' : 'Black to move'

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Puzzles</h1>
          {puzzle.daily && <span className="pill pill-gold">★ Daily</span>}
          {trainMode && <span className="pill pill-green">⚡ Weakness focus</span>}
          {reviewMode && <span className="pill pill-gold">↻ Mistake review</span>}
        </div>
      </div>

      <div className="layout-two-col">
        {/* Board column */}
        <div className="layout-board">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>{turnLabel}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="pill pill-blue">{puzzle.theme}</span>
              {typeof puzzle.rating === 'number' && <span className="pill pill-muted">rated {puzzle.rating}</span>}
            </div>
          </div>
          <Board position={fen} orientation={orientation} onDrop={onDrop} allowDragging={status !== 'solved'} squareStyles={hintSquares} arrows={hintArrow} id="puzzles" />
          {/* Rating + streak chips */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <div className="panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tiny-label">Rating</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{playerStats.rating}</span>
              {ratingDelta !== null && <span style={{ fontSize: 13, fontWeight: 700, color: ratingDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{ratingDelta >= 0 ? '+' : ''}{ratingDelta}</span>}
            </div>
            <div className="panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tiny-label">🔥 Streak</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{playerStats.streak || 0}</span>
            </div>
          </div>
        </div>

        {/* Coach column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {status === 'solved' ? (
            <CoachPanel tone="good" eyebrow="Solved" icon="✓" title={`${puzzle.theme} — nicely done!`}
              actions={<>
                <button className="btn-primary" onClick={pickNext}>Next puzzle →</button>
                <button className="btn-secondary" onClick={trainSameTheme}>Train same theme</button>
                {missedCount > 0 && <button className="btn-gold" onClick={() => { setReviewMode(true); setTimeout(pickNextReview, 0) }}>Review mistakes</button>}
              </>}>
              <p>{c.explanation}</p>
              <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--text)' }}>Remember:</strong> {c.pattern}</p>
              {ratingDelta !== null && <p style={{ marginTop: 6 }}>Rating {ratingDelta >= 0 ? 'gained' : 'change'}: <strong style={{ color: ratingDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{ratingDelta >= 0 ? '+' : ''}{ratingDelta}</strong></p>}
            </CoachPanel>
          ) : (
            <CoachPanel
              tone={status === 'wrong' ? 'bad' : reviewMode ? 'coach' : trainMode ? 'warning' : 'info'}
              eyebrow={reviewMode ? 'Mistake review' : trainMode ? 'Weakness focus' : 'Your move'}
              icon={status === 'wrong' ? '✗' : '🎯'}
              title={status === 'wrong' ? 'Try again' : puzzle.daily ? 'Daily puzzle' : `Find the ${puzzle.theme.toLowerCase()}`}>
              {status === 'wrong'
                ? <p>{message}</p>
                : <p>{reviewMode ? 'Repeating puzzles you missed until you solve them cleanly.'
                    : trainMode ? 'Serving puzzles from your lowest solve-rate themes.'
                    : puzzle.description || 'Find the strongest move for the side to move.'}</p>}
              {hintLevel >= 1 && <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--gold)' }}>Idea:</strong> {c.concept}</p>}
              {hintLevel >= 2 && <p style={{ marginTop: 4 }}><strong style={{ color: 'var(--gold)' }}>Forcing:</strong> {c.forcing}</p>}
            </CoachPanel>
          )}

          {/* Hint ladder */}
          {status !== 'solved' && (
            <div>
              {hintLevel < 5 && (
                <button className="btn-gold" style={{ width: '100%' }} onClick={useHint}>{HINT_LABELS[hintLevel]}</button>
              )}
              {hintLevel > 0 && <p className="muted" style={{ fontSize: 12, marginTop: 6, textAlign: 'center' }}>Hint level {hintLevel} / 5</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="button-row">
            <button className="btn-secondary" onClick={() => loadPuzzle(idx)}>Reset</button>
            {idx > 0 && !reviewMode && <button className="btn-secondary" onClick={() => loadPuzzle(idx - 1)}>← Prev</button>}
            <button className="btn-primary" onClick={pickNext} disabled={!trainMode && !reviewMode && idx >= puzzles.length - 1}>Next →</button>
          </div>

          {/* Mode toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className={trainMode ? 'btn-success' : 'btn-secondary'} style={{ width: '100%' }}
              onClick={() => { setReviewMode(false); setTrainMode(t => !t) }}>
              {trainMode ? '⚡ Training weaknesses — stop' : 'Train my weaknesses'}
            </button>
            <button className={reviewMode ? 'btn-gold' : 'btn-secondary'} style={{ width: '100%' }}
              disabled={!reviewMode && !missedCount}
              onClick={() => { if (reviewMode) setReviewMode(false); else if (missedCount) { setTrainMode(false); setReviewMode(true); setTimeout(pickNextReview, 0) } }}>
              {reviewMode ? '↻ Reviewing mistakes — stop' : `Review mistakes (${missedCount})`}
            </button>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => onNav('rush')}>⚡ Puzzle Rush</button>
          </div>

          {/* Collapsible library */}
          <details style={{ marginTop: 4 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: '6px 0' }}>
              Puzzle library · {dailyStatus === 'loading' ? 'loading daily…' : `${puzzles.length} puzzles`}
            </summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {puzzles.map((p, i) => (
                <button key={p.id} onClick={() => loadPuzzle(i)} aria-label={`Puzzle ${i + 1}`}
                  style={{ padding: '4px 9px', fontSize: 12, minHeight: 30, borderRadius: 6,
                    background: i === idx ? 'var(--accent)' : p.daily ? 'rgba(242,201,76,0.12)' : 'var(--surface-3)',
                    color: i === idx ? '#fff' : p.daily ? 'var(--gold)' : 'var(--muted)',
                    border: p.daily ? '1px solid rgba(242,201,76,0.3)' : '1px solid transparent' }}>
                  {p.daily ? '★' : i + (dailyStatus === 'ok' ? 0 : 1)}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
