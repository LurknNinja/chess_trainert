import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import { useStockfish } from '../hooks/useStockfish.js'
import { ENDGAMES } from '../data/endgames.js'
import { playMoveSound } from '../utils/sound.js'

export default function Endgames() {
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(ENDGAMES[0].fen)
  const [statusMsg, setStatusMsg] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintArrow, setHintArrow] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const { send, onMessage, engineError } = useStockfish()
  const fenRef = useRef(fen)
  fenRef.current = fen
  const thinkingTimer = useRef(null)
  const hintModeRef = useRef(false)
  const endgame = ENDGAMES[idx]

  function loadEndgame(i) {
    setIdx(i)
    setFen(ENDGAMES[i].fen)
    setStatusMsg('')
    setThinking(false)
    setShowHint(false)
    setHintArrow([])
    setMoveCount(0)
    hintModeRef.current = false
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

  function requestHintArrow() {
    const g = new Chess(fenRef.current)
    if (g.isGameOver()) return
    const playerTurn = endgame.color === 'white' ? 'w' : 'b'
    if (g.turn() !== playerTurn) return
    hintModeRef.current = true
    setThinking(true)
    send('position fen ' + fenRef.current)
    send('go depth 10')
    clearTimeout(thinkingTimer.current)
    thinkingTimer.current = setTimeout(() => {
      hintModeRef.current = false
      setThinking(false)
    }, 10000)
  }

  function toggleHint() {
    const next = !showHint
    setShowHint(next)
    if (next) {
      setHintArrow([])
      requestHintArrow()
    } else {
      setHintArrow([])
    }
  }

  useEffect(() => {
    const unsub = onMessage((line) => {
      if (line.startsWith('bestmove')) {
        clearTimeout(thinkingTimer.current)
        const uci = line.split(' ')[1]
        if (!uci || uci === '(none)') { setThinking(false); return }

        if (hintModeRef.current) {
          hintModeRef.current = false
          setHintArrow([{ startSquare: uci.slice(0, 2), endSquare: uci.slice(2, 4), color: '#f0c040' }])
          setThinking(false)
          return
        }

        const g = new Chess(fenRef.current)
        let m
        try { m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }) }
        catch { setThinking(false); return }
        setFen(g.fen())
        playMoveSound(m, g)
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
    let m
    try { m = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }
    setFen(g.fen())
    playMoveSound(m, g)
    setMoveCount(c => c + 1)
    setStatusMsg(computeStatus(g))
    setHintArrow([])
    return true
  }, [fen, thinking, endgame.color, computeStatus])

  const game = new Chess(fen)
  const over = game.isGameOver()
  const won = game.isCheckmate() && (game.turn() !== (endgame.color === 'white' ? 'w' : 'b'))
  const target = endgame.targetMoves

  // Result feedback once the position is decided.
  let result = null
  if (over) {
    if (won) result = (target && moveCount > target)
      ? { tone: 'warning', icon: '👍', title: 'Good finish!', text: `Checkmate in ${moveCount} moves. Try again and beat the target of ${target}.` }
      : { tone: 'good', icon: '🏆', title: 'Excellent technique!', text: `Checkmate in ${moveCount} moves${target ? ` (target ${target})` : ''}.` }
    else result = { tone: 'warning', icon: '½', title: 'Drawn', text: 'Review the technique checklist and try again — precision matters here.' }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Endgame Trainer</h1>
        <p className="page-subtitle">Practice the techniques that turn winning positions into wins.</p></div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
        {ENDGAMES.map((e, i) => (
          <button key={e.id} onClick={() => loadEndgame(i)} className="card-hover"
            style={{ flex: '0 0 auto', width: 150, textAlign: 'left', padding: 14, borderRadius: 'var(--radius-md)',
              background: idx === i ? 'var(--surface-2)' : 'var(--surface)', border: `1px solid ${idx === i ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column', gap: 6, minHeight: 44 }} aria-pressed={idx === i}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</span>
            {e.difficulty && <span className="pill pill-muted" style={{ alignSelf: 'flex-start' }}>{e.difficulty}</span>}
          </button>
        ))}
      </div>

      <div className="layout-two-col">
        <div className="layout-board">
          <Board position={fen} orientation={endgame.color} onDrop={onDrop} allowDragging={!thinking && !over} arrows={hintArrow} id="endgames" />
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <span className="pill pill-muted">Moves: {moveCount}{target ? ` / ${target} target` : ''}</span>
            {thinking && <span className="pill pill-blue">Engine thinking…</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result
            ? <CoachPanel tone={result.tone} icon={result.icon} eyebrow="Result" title={result.title}>{result.text}</CoachPanel>
            : <CoachPanel tone="info" icon="♔" eyebrow={`${endgame.name}${endgame.difficulty ? ` · ${endgame.difficulty}` : ''}`} title={endgame.goal}>
                <p>{statusMsg || 'Make your move.'}</p>
                {showHint && <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--gold)' }}>Hint:</strong> {endgame.hint}</p>}
              </CoachPanel>}

          {endgame.technique && (
            <div className="panel">
              <p className="section-title" style={{ color: 'var(--accent)' }}>Technique checklist</p>
              <ol style={{ margin: '0 0 0 18px', color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.7 }}>
                {endgame.technique.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
          )}

          <div className="button-row">
            <button className="btn-secondary" onClick={() => loadEndgame(idx)}>{over ? 'Try again' : 'Reset'}</button>
            <button className="btn-gold" onClick={toggleHint} disabled={over}>{showHint ? 'Hide hint' : 'Hint'}</button>
          </div>

          {endgame.commonMistakes && (
            <details>
              <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: '4px 0' }}>Common mistakes</summary>
              <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.6 }}>
                {endgame.commonMistakes.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
              </ul>
            </details>
          )}

          {engineError && <p style={{ color: 'var(--danger)', fontSize: 12 }}>Engine unavailable: {engineError}</p>}
        </div>
      </div>
    </div>
  )
}
