import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from '../hooks/useStockfish.js'
import { ENDGAMES } from '../data/endgames.js'

export default function Endgames() {
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(ENDGAMES[0].fen)
  const [statusMsg, setStatusMsg] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const { send, onMessage, engineError } = useStockfish()
  const fenRef = useRef(fen)
  fenRef.current = fen
  const thinkingTimer = useRef(null)
  const endgame = ENDGAMES[idx]

  function loadEndgame(i) {
    setIdx(i)
    setFen(ENDGAMES[i].fen)
    setStatusMsg('')
    setThinking(false)
    setShowHint(false)
    setMoveCount(0)
  }

  const computeStatus = useCallback((g) => {
    if (g.isCheckmate()) return g.turn() === 'w' ? '0-1 Black wins by checkmate!' : '1-0 Checkmate! You won!'
    if (g.isDraw()) return '½-½ Draw'
    if (g.isCheck()) return g.turn() === 'w' ? 'White is in check' : 'Black is in check'
    return g.turn() === 'w' ? 'White to move' : 'Black to move'
  }, [])

  const engineMove = useCallback((currentFen) => {
    const g = new Chess(currentFen)
    if (g.isGameOver()) return
    setThinking(true)
    send('position fen ' + currentFen)
    send('go depth 8')
    clearTimeout(thinkingTimer.current)
    thinkingTimer.current = setTimeout(() => setThinking(false), 10000)
  }, [send])

  useEffect(() => {
    const unsub = onMessage((line) => {
      if (line.startsWith('bestmove')) {
        clearTimeout(thinkingTimer.current)
        const uci = line.split(' ')[1]
        if (!uci || uci === '(none)') { setThinking(false); return }
        const g = new Chess(fenRef.current)
        try { g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }) }
        catch { setThinking(false); return }
        setFen(g.fen())
        setThinking(false)
        setStatusMsg(computeStatus(g))
      }
    })
    return unsub
  }, [onMessage, computeStatus])

  useEffect(() => {
    const g = new Chess(fen)
    if (g.isGameOver()) return
    const playerTurn = endgame.color === 'white' ? 'w' : 'b'
    if (g.turn() !== playerTurn) setTimeout(() => engineMove(fen), 400)
  }, [fen, endgame.color, engineMove])

  const onDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (thinking) return false
    const g = new Chess(fen)
    if (g.isGameOver()) return false
    const playerTurn = endgame.color === 'white' ? 'w' : 'b'
    if (g.turn() !== playerTurn) return false
    try { g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }
    setFen(g.fen())
    setMoveCount(c => c + 1)
    setStatusMsg(computeStatus(g))
    return true
  }, [fen, thinking, endgame.color, computeStatus])

  const game = new Chess(fen)

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Endgame Trainer</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Practice essential endgame positions.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ENDGAMES.map((e, i) => (
          <button key={e.id} onClick={() => loadEndgame(i)}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, background: idx === i ? '#4f8ef7' : '#2a2a4a', color: idx === i ? '#fff' : '#aaa' }}>
            {e.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: endgame.color,
              animationDurationInMs: 200,
              boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006' },
              allowDragging: !thinking && !game.isGameOver(),
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{endgame.name}</p>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>{endgame.goal}</p>
            {statusMsg && (
              <p style={{ fontWeight: 600, marginBottom: 8, color: game.isCheckmate() ? '#34c37a' : game.isDraw() ? '#f0c040' : '#4f8ef7' }}>
                {statusMsg}
              </p>
            )}
            {thinking && <p style={{ color: '#f0c040', fontSize: 13 }}>Engine thinking…</p>}
            <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Moves: {moveCount}</p>
            {showHint && (
              <p style={{ marginTop: 12, padding: 10, background: '#0d1b2a', borderRadius: 6, fontSize: 13, color: '#a0c4ff' }}>
                💡 {endgame.hint}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => loadEndgame(idx)}>Reset</button>
            <button className="btn-secondary" onClick={() => setShowHint(h => !h)}>
              {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          </div>
          {engineError && <p style={{ marginTop: 12, color: '#e05454', fontSize: 12 }}>Engine unavailable: {engineError}</p>}
        </div>
      </div>
    </div>
  )
}
