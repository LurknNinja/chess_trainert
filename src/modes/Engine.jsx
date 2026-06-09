import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import { useStockfish } from '../hooks/useStockfish.js'
import EvalBar from '../components/EvalBar.jsx'
import { capturedPieces, pieceGlyph, materialBalance, normalizeScore } from '../utils/chess.js'
import { playMoveSound, sound } from '../utils/sound.js'
import { recordGame } from '../hooks/useStats.js'
import { classifyMove, accuracyFromLosses, TAG_META } from '../utils/review.js'

const REVIEW_DEPTH = 11

const LEVELS = [
  { label: 'Beginner',     skill: 0,  movetime: 50,   elo: 800  },
  { label: 'Casual',       skill: 3,  movetime: 120,  elo: 1000 },
  { label: 'Intermediate', skill: 8,  movetime: 300,  elo: 1400 },
  { label: 'Advanced',     skill: 14, movetime: 900,  elo: 1900 },
  { label: 'Master',       skill: 20, movetime: 2000, elo: 2400 },
]

const START_FEN = new Chess().fen()

function MoveList({ history }) {
  const scrollRef = useRef(null)
  // Scroll only the list container, never the page (scrollIntoView would scroll
  // every ancestor, yanking the whole mobile viewport down on each move).
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history])
  const pairs = useMemo(() => {
    const rows = []
    for (let i = 0; i < history.length; i += 2)
      rows.push({ n: Math.floor(i / 2) + 1, w: history[i], b: history[i + 1] })
    return rows
  }, [history])
  if (!pairs.length) return <p style={{ fontSize: 12, color: '#444' }}>No moves yet</p>
  return (
    <div ref={scrollRef} style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13, fontFamily: 'monospace' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {pairs.map(({ n, w, b }) => (
            <tr key={n} style={{ borderBottom: '1px solid #1e2a42' }}>
              <td style={{ color: '#444', paddingRight: 8, userSelect: 'none', width: 28 }}>{n}.</td>
              <td style={{ color: '#c8d8f0', padding: '3px 8px 3px 0', width: '50%' }}>{w}</td>
              <td style={{ color: '#c8d8f0', padding: '3px 0' }}>{b ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CapturedRow({ pieces, color, advantage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 22, flexWrap: 'wrap' }}>
      {pieces.map((t, i) => (
        <span key={i} style={{ fontSize: 18, lineHeight: 1, color: color === 'w' ? '#f0f0f0' : '#5a5a72' }}>
          {pieceGlyph(color, t)}
        </span>
      ))}
      {advantage > 0 && <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>+{advantage}</span>}
    </div>
  )
}

function ReviewPanel({ review, playerColor, onJump, onFlip, onNewGame }) {
  const { moves, accuracy, counts, ply } = review
  const myColor = playerColor === 'white' ? 'w' : 'b'
  const rows = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: moves[i], b: moves[i + 1], wi: i, bi: i + 1 })
  }
  const Cell = ({ m, idx }) => {
    if (!m) return <td style={{ padding: '3px 0' }} />
    const meta = TAG_META[m.tag]
    const active = ply === idx + 1
    const flagged = m.side === myColor && (m.tag === 'blunder' || m.tag === 'mistake' || m.tag === 'inaccuracy')
    return (
      <td style={{ padding: '2px 4px' }}>
        <button onClick={() => onJump(idx + 1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', minHeight: 0,
            borderRadius: 4, fontFamily: 'monospace', fontSize: 13,
            background: active ? '#2a3a5c' : 'transparent', color: '#c8d8f0', width: '100%', justifyContent: 'flex-start',
          }}>
          {m.san}
          {flagged && <span style={{ color: meta.color, fontWeight: 700, fontSize: 11 }}>{meta.sym}</span>}
        </button>
      </td>
    )
  }
  return (
    <div>
      <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>YOUR ACCURACY</p>
        <p style={{ fontSize: 34, fontWeight: 800, color: accuracy >= 80 ? '#34c37a' : accuracy >= 60 ? '#e0b020' : '#e0843c', lineHeight: 1 }}>{accuracy}%</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 13 }}>
          <span style={{ color: TAG_META.inaccuracy.color }}>{counts.inaccuracy} ?!</span>
          <span style={{ color: TAG_META.mistake.color }}>{counts.mistake} ?</span>
          <span style={{ color: TAG_META.blunder.color }}>{counts.blunder} ??</span>
        </div>
      </div>
      <div style={{ background: '#16213e', borderRadius: 10, padding: '12px 14px', marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map(r => (
              <tr key={r.n}>
                <td style={{ color: '#444', width: 24, fontFamily: 'monospace', fontSize: 12 }}>{r.n}.</td>
                <Cell m={r.w} idx={r.wi} /><Cell m={r.b} idx={r.bi} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button className="btn-secondary" onClick={() => onJump(0)}>⏮</button>
        <button className="btn-secondary" onClick={() => onJump(ply - 1)}>← Prev</button>
        <button className="btn-secondary" onClick={() => onJump(ply + 1)}>Next →</button>
        <button className="btn-secondary" onClick={onFlip}>⇅ Flip</button>
      </div>
      <button className="btn-primary" style={{ width: '100%' }} onClick={onNewGame}>New Game</button>
    </div>
  )
}

export default function Engine() {
  const [level, setLevel] = useState(2)
  const [playerColor, setPlayerColor] = useState('white')
  const [fen, setFen] = useState(START_FEN)
  const [history, setHistory] = useState([])
  const [started, setStarted] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [thinking, setThinking] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [evalScore, setEvalScore] = useState({ cp: 0, mate: null })
  const [hintArrow, setHintArrow] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [review, setReview] = useState({ status: 'none' }) // none | analyzing | done

  const play = useStockfish()       // makes the opponent's moves (skill-limited)
  const analysis = useStockfish()   // full-strength: eval bar + hints

  // Authoritative game lives in a ref so the move list keeps full history.
  const gameRef = useRef(new Chess())
  const thinkingTimer = useRef(null)
  const resultRecorded = useRef(false)
  const bestMoveRef = useRef(null)
  const analysisTurnRef = useRef('w') // side to move in the position being analyzed

  const engineColor = playerColor === 'white' ? 'b' : 'w'

  const computeStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White'
      return `${g.turn() === 'w' ? '0-1' : '1-0'} ${winner} wins by checkmate`
    }
    if (g.isStalemate()) return '½-½ Draw by stalemate'
    if (g.isDraw()) return '½-½ Draw'
    if (g.isCheck()) return g.turn() === 'w' ? 'White is in check' : 'Black is in check'
    return g.turn() === 'w' ? "White to move" : "Black to move"
  }, [])

  const maybeRecordResult = useCallback((g) => {
    if (resultRecorded.current || !g.isGameOver()) return
    resultRecorded.current = true
    if (g.isCheckmate()) {
      const loserTurn = g.turn() // side that cannot move = loser
      const playerLost = loserTurn === (playerColor === 'white' ? 'w' : 'b')
      if (playerLost) { recordGame('loss'); sound.lose() }
      else { recordGame('win'); sound.win() }
    } else {
      recordGame('draw')
    }
  }, [playerColor])

  // Sync React state from the authoritative game and react to game-over.
  const sync = useCallback((soundMove) => {
    const g = gameRef.current
    const over = g.isGameOver()
    // On a terminal move, the result handler owns the chime (win/lose), so the
    // generic move sound is skipped to avoid a conflicting win+lose double-play.
    if (soundMove && !over) playMoveSound(soundMove, g)
    setFen(g.fen())
    setHistory(g.history())
    setStatusMsg(computeStatus(g))
    setHintArrow([])
    if (over) { setGameOver(true); maybeRecordResult(g) }
  }, [computeStatus, maybeRecordResult])

  const engineMove = useCallback(() => {
    const g = gameRef.current
    if (g.isGameOver()) return
    setThinking(true)
    play.send('setoption name Skill Level value ' + LEVELS[level].skill)
    play.send('position fen ' + g.fen())
    play.send('go movetime ' + LEVELS[level].movetime)
    clearTimeout(thinkingTimer.current)
    thinkingTimer.current = setTimeout(() => setThinking(false), 12000)
  }, [play, level])

  // Opponent move handler.
  useEffect(() => {
    const unsub = play.onMessage((line) => {
      if (!line.startsWith('bestmove')) return
      clearTimeout(thinkingTimer.current)
      const uci = line.split(' ')[1]
      setThinking(false)
      if (!uci || uci === '(none)') return
      const g = gameRef.current
      // Ignore stale replies after a takeback / new game.
      if (g.turn() !== engineColor || g.isGameOver()) return
      let m
      try { m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }) }
      catch { return }
      sync(m)
    })
    return unsub
  }, [play, engineColor, sync])

  // Analysis handler: live eval + best-move hint.
  useEffect(() => {
    const unsub = analysis.onMessage((line) => {
      if (line.startsWith('info') && line.includes(' score ')) {
        const m = line.match(/score (cp|mate) (-?\d+)/)
        const pv = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (m) {
          setEvalScore(normalizeScore({ type: m[1], value: parseInt(m[2], 10) }, analysisTurnRef.current))
        }
        if (pv) bestMoveRef.current = pv[1]
      } else if (line.startsWith('bestmove')) {
        const uci = line.split(' ')[1]
        if (uci && uci !== '(none)') bestMoveRef.current = uci
      }
    })
    return unsub
  }, [analysis])

  // Whenever the position changes, refresh the evaluation.
  useEffect(() => {
    if (!started) return
    const g = new Chess(fen)
    if (g.isGameOver()) return
    bestMoveRef.current = null
    analysisTurnRef.current = g.turn()
    analysis.send('position fen ' + fen)
    analysis.send('go depth 12')
    return () => analysis.send('stop')
  }, [fen, started, analysis])

  // Trigger the engine's reply when it is its turn.
  useEffect(() => {
    if (!started) return
    const g = gameRef.current
    if (g.isGameOver()) return
    if (g.turn() === engineColor && !thinking) {
      const id = setTimeout(engineMove, 250)
      return () => clearTimeout(id)
    }
  }, [fen, started, engineColor, engineMove]) // eslint-disable-line

  function startGame() {
    gameRef.current = new Chess()
    resultRecorded.current = false
    setGameOver(false)
    setFlipped(playerColor === 'black')
    setStarted(true)
    setEvalScore({ cp: 0, mate: null })
    setReview({ status: 'none' })
    sync()
    sound.click()
  }

  function newGame() {
    gameRef.current = new Chess()
    resultRecorded.current = false
    setStarted(false)
    setGameOver(false)
    setFen(START_FEN)
    setHistory([])
    setEvalScore({ cp: 0, mate: null })
    setReview({ status: 'none' })
  }

  function takeback() {
    const g = gameRef.current
    if (thinking || review.status !== 'none') return
    // Undo back to the player's turn (usually two plies).
    let undone = 0
    while (g.history().length > 0 && undone < 2) {
      g.undo(); undone++
      if (g.turn() === (playerColor === 'white' ? 'w' : 'b')) break
    }
    resultRecorded.current = false
    setGameOver(false)
    sync()
    sound.click()
  }

  function resign() {
    if (gameOver) return
    setGameOver(true)
    resultRecorded.current = true
    recordGame('loss')
    setStatusMsg('You resigned — ' + (playerColor === 'white' ? 'Black' : 'White') + ' wins')
    sound.lose()
  }

  function showHint() {
    const uci = bestMoveRef.current
    if (!uci) return
    setHintArrow([{ startSquare: uci.slice(0, 2), endSquare: uci.slice(2, 4), color: 'rgba(79,142,247,0.85)' }])
    sound.click()
  }

  // Analyse one position to a fixed depth; resolves white-POV eval + best move.
  const analyzeOne = useCallback((positionFen) => new Promise((resolve) => {
    const turn = positionFen.split(' ')[1]
    let cp = 0, mate = null, best = null
    const unsub = analysis.onMessage((line) => {
      if (line.startsWith('info') && line.includes(' score ')) {
        const m = line.match(/score (cp|mate) (-?\d+)/)
        const pv = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (m) { const n = normalizeScore({ type: m[1], value: parseInt(m[2], 10) }, turn); cp = n.cp; mate = n.mate }
        if (pv) best = pv[1]
      } else if (line.startsWith('bestmove')) {
        const u = line.split(' ')[1]
        if (!best && u && u !== '(none)') best = u
        unsub()
        resolve({ cp, mate, best })
      }
    })
    analysis.send('position fen ' + positionFen)
    analysis.send('go depth ' + REVIEW_DEPTH)
  }), [analysis])

  async function reviewGame() {
    const sans = gameRef.current.history()
    if (!sans.length) return
    const g = new Chess()
    const fens = [g.fen()]
    const ucis = []
    for (const san of sans) { const mv = g.move(san); ucis.push(mv.from + mv.to + (mv.promotion || '')); fens.push(g.fen()) }
    setReview({ status: 'analyzing', progress: 0, total: fens.length })
    const evals = []
    for (let i = 0; i < fens.length; i++) {
      evals.push(await analyzeOne(fens[i])) // eslint-disable-line no-await-in-loop
      setReview({ status: 'analyzing', progress: i + 1, total: fens.length })
    }
    const moves = ucis.map((uci, i) => {
      const side = fens[i].split(' ')[1]
      const wasBest = evals[i].best && evals[i].best.slice(0, 4) === uci.slice(0, 4)
      const { tag, loss } = classifyMove(evals[i].cp, evals[i + 1].cp, side, wasBest)
      return { san: sans[i], uci, side, tag, loss }
    })
    const myColor = playerColor === 'white' ? 'w' : 'b'
    const accuracy = accuracyFromLosses(moves.filter(m => m.side === myColor).map(m => m.loss))
    const counts = { blunder: 0, mistake: 0, inaccuracy: 0 }
    moves.filter(m => m.side === myColor).forEach(m => { if (counts[m.tag] !== undefined) counts[m.tag]++ })
    setReview({ status: 'done', fens, evals, moves, accuracy, counts, ply: fens.length - 1 })
    sound.click()
  }

  function setReviewPly(ply) {
    setReview(r => r.status === 'done' ? { ...r, ply: Math.max(0, Math.min(r.fens.length - 1, ply)) } : r)
  }

  const onDrop = useCallback(({ sourceSquare, targetSquare }) => {
    const g = gameRef.current
    if (thinking || g.isGameOver()) return false
    if (g.turn() === engineColor) return false
    let m
    try { m = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }
    sync(m)
    return true
  }, [thinking, engineColor, sync])

  if (play.engineError) {
    return (
      <div>
        <h2 style={{ marginBottom: 16 }}>Play vs Engine</h2>
        <div style={{ background: '#3a1a1a', border: '1px solid #e05454', borderRadius: 10, padding: 20 }}>
          <p style={{ color: '#e05454', fontWeight: 700, marginBottom: 8 }}>Engine unavailable</p>
          <p style={{ color: '#aaa', fontSize: 13 }}>{play.engineError}. Try a desktop browser or refresh.</p>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>Play vs Engine</h2>
        <div style={{ background: '#16213e', borderRadius: 10, padding: 24, maxWidth: 420 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Your color</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['white', 'black'].map(c => (
                <button key={c} onClick={() => setPlayerColor(c)}
                  style={{ padding: '8px 20px', borderRadius: 6, background: playerColor === c ? '#4f8ef7' : '#2a2a4a', color: playerColor === c ? '#fff' : '#aaa', fontWeight: 600 }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Difficulty</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LEVELS.map((l, i) => (
                <button key={i} onClick={() => setLevel(i)}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 6, background: level === i ? '#4f8ef7' : '#2a2a4a', color: level === i ? '#fff' : '#aaa' }}>
                  {l.label} <span style={{ opacity: 0.6, fontSize: 12 }}>~{l.elo}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="btn-success" style={{ width: '100%', padding: 12, fontSize: 15 }} onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    )
  }

  const orientation = flipped ? 'black' : 'white'
  const reviewing = review.status === 'done'
  const boardPos = reviewing ? review.fens[review.ply] : fen
  // During review, draw an arrow for the move that produced the shown position.
  let boardArrows = hintArrow
  if (reviewing && review.ply > 0) {
    const mv = review.moves[review.ply - 1]
    boardArrows = [{ startSquare: mv.uci.slice(0, 2), endSquare: mv.uci.slice(2, 4), color: TAG_META[mv.tag].color }]
  }
  const { whiteCaptured, blackCaptured } = capturedPieces(boardPos)
  const { diff } = materialBalance(boardPos)
  // Top row shows pieces the player at the top has captured.
  const topCaptured = orientation === 'white' ? { pieces: blackCaptured, color: 'b', adv: diff < 0 ? -diff : 0 }
                                              : { pieces: whiteCaptured, color: 'w', adv: diff > 0 ? diff : 0 }
  const botCaptured = orientation === 'white' ? { pieces: whiteCaptured, color: 'w', adv: diff > 0 ? diff : 0 }
                                              : { pieces: blackCaptured, color: 'b', adv: diff < 0 ? -diff : 0 }

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Play vs Engine</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        You play <strong style={{ color: '#e0e0e0' }}>{playerColor}</strong> · {LEVELS[level].label}
        {thinking && <span style={{ color: '#f0c040', marginLeft: 12 }}>Engine thinking…</span>}
      </p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* flex-start keeps the board column at its natural (auto) height so the
            square board self-sizes — a stretched container would give the board a
            definite height and reintroduce gaps between ranks. The eval bar uses
            align-self:stretch to match the board's height. */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: 460, maxWidth: '100%' }}>
          <EvalBar evalScore={evalScore} flipped={flipped} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <CapturedRow pieces={topCaptured.pieces} color={topCaptured.color} advantage={topCaptured.adv} />
            <Board
              position={boardPos}
              orientation={orientation}
              onDrop={onDrop}
              allowDragging={!thinking && !gameOver && review.status === 'none'}
              arrows={boardArrows}
              id="engine"
            />
            <CapturedRow pieces={botCaptured.pieces} color={botCaptured.color} advantage={botCaptured.adv} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {reviewing ? (
            <ReviewPanel review={review} playerColor={playerColor} onJump={setReviewPly} onFlip={() => setFlipped(f => !f)} onNewGame={newGame} />
          ) : (
            <>
              <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12, color: gameOver ? '#34c37a' : '#e0e0e0' }}>{statusMsg}</p>
                <MoveList history={history} />
              </div>
              {review.status === 'analyzing' && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Analyzing game… {review.progress}/{review.total}</p>
                  <div style={{ height: 6, borderRadius: 4, background: '#1e2a42', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((review.progress / review.total) * 100)}%`, height: '100%', background: '#4f8ef7', transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}
              {gameOver && review.status === 'none' && (
                <button className="btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={reviewGame}>🔎 Review Game</button>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <button className="btn-secondary" onClick={showHint} disabled={gameOver || thinking}>💡 Hint</button>
                <button className="btn-secondary" onClick={takeback} disabled={gameOver || thinking || history.length === 0}>↩ Takeback</button>
                <button className="btn-secondary" onClick={() => setFlipped(f => !f)}>⇅ Flip</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!gameOver && <button className="btn-danger" onClick={resign}>Resign</button>}
                <button className="btn-primary" onClick={newGame}>New Game</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
