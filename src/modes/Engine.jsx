import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from '../hooks/useStockfish.js'

const LEVELS = [
  { label: 'Beginner',     depth: 1,  elo: 800  },
  { label: 'Intermediate', depth: 5,  elo: 1200 },
  { label: 'Advanced',     depth: 10, elo: 1800 },
  { label: 'Master',       depth: 18, elo: 2400 },
]

export default function Engine() {
  const [level, setLevel] = useState(1)
  const [playerColor, setPlayerColor] = useState('white')
  const [game, setGame] = useState(new Chess())
  const [started, setStarted] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [thinking, setThinking] = useState(false)
  const { send, onMessage } = useStockfish()
  const gameRef = useRef(game)
  gameRef.current = game

  const computeStatus = useCallback((g) => {
    if (g.isCheckmate()) return g.turn() === 'w' ? '0-1 Black wins by checkmate' : '1-0 White wins by checkmate'
    if (g.isDraw()) return '½-½ Draw'
    if (g.isCheck()) return g.turn() === 'w' ? 'White is in check' : 'Black is in check'
    return g.turn() === 'w' ? "White's turn" : "Black's turn"
  }, [])

  const engineMove = useCallback((g) => {
    if (g.isGameOver()) return
    setThinking(true)
    send('position fen ' + g.fen())
    send('go depth ' + LEVELS[level].depth)
  }, [send, level])

  useEffect(() => {
    const unsub = onMessage((line) => {
      if (line.startsWith('bestmove')) {
        const uci = line.split(' ')[1]
        if (!uci || uci === '(none)') return
        const g = new Chess(gameRef.current.fen())
        g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' })
        setGame(g)
        setThinking(false)
        setStatusMsg(computeStatus(g))
      }
    })
    return unsub
  }, [onMessage, computeStatus])

  // Engine plays immediately if it's its turn
  useEffect(() => {
    if (!started || game.isGameOver()) return
    const engineColor = playerColor === 'white' ? 'b' : 'w'
    if (game.turn() === engineColor) {
      engineMove(game)
    }
  }, [game, started, playerColor, engineMove])

  function startGame() {
    const g = new Chess()
    setGame(g)
    setStarted(true)
    setStatusMsg(computeStatus(g))
    if (playerColor === 'black') {
      setTimeout(() => engineMove(g), 300)
    }
  }

  const onDrop = useCallback((from, to) => {
    if (thinking) return false
    const engineColor = playerColor === 'white' ? 'b' : 'w'
    if (game.turn() === engineColor) return false
    const g = new Chess(game.fen())
    const move = g.move({ from, to, promotion: 'q' })
    if (!move) return false
    setGame(g)
    setStatusMsg(computeStatus(g))
    return true
  }, [game, thinking, playerColor, computeStatus])

  if (!started) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>Play vs Engine</h2>
        <div style={{ background: '#16213e', borderRadius: 10, padding: 24, maxWidth: 400 }}>
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

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Play vs Engine</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        You play <strong style={{ color: '#e0e0e0' }}>{playerColor}</strong> · {LEVELS[level].label}
        {thinking && <span style={{ color: '#f0c040', marginLeft: 12 }}>Engine thinking…</span>}
      </p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            customBoardStyle={{ borderRadius: 8, boxShadow: '0 4px 24px #0006' }}
            arePiecesDraggable={!thinking && !game.isGameOver()}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>{statusMsg}</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13, color: '#888', fontFamily: 'monospace' }}>
              {game.history().map((m, i) => (
                <span key={i} style={{ marginRight: 8 }}>
                  {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-danger" onClick={() => setStarted(false)}>New Game</button>
          </div>
        </div>
      </div>
    </div>
  )
}
