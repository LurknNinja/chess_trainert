import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from '../hooks/useStockfish.js'
import EvalBar from '../components/EvalBar.jsx'
import { capturedPieces, pieceGlyph, materialBalance, normalizeScore } from '../utils/chess.js'
import { playMoveSound, sound } from '../utils/sound.js'
import { recordGame } from '../hooks/useStats.js'

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
  }

  function takeback() {
    const g = gameRef.current
    if (thinking) return
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
  const { whiteCaptured, blackCaptured } = capturedPieces(fen)
  const { diff } = materialBalance(fen)
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
            <Chessboard
              options={{
                position: fen,
                onPieceDrop: onDrop,
                boardOrientation: orientation,
                animationDurationInMs: 200,
                boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006', aspectRatio: '1 / 1', height: 'auto' },
                allowDragging: !thinking && !gameOver,
                arrows: hintArrow,
              }}
            />
            <CapturedRow pieces={botCaptured.pieces} color={botCaptured.color} advantage={botCaptured.adv} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 12, color: gameOver ? '#34c37a' : '#e0e0e0' }}>{statusMsg}</p>
            <MoveList history={history} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <button className="btn-secondary" onClick={showHint} disabled={gameOver || thinking}>💡 Hint</button>
            <button className="btn-secondary" onClick={takeback} disabled={gameOver || thinking || history.length === 0}>↩ Takeback</button>
            <button className="btn-secondary" onClick={() => setFlipped(f => !f)}>⇅ Flip</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!gameOver && <button className="btn-danger" onClick={resign}>Resign</button>}
            <button className="btn-primary" onClick={newGame}>New Game</button>
          </div>
        </div>
      </div>
    </div>
  )
}
