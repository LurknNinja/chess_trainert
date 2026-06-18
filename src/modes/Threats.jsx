import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import { THREATS, THREAT_CHOICES } from '../data/threats.js'
import { sound } from '../utils/sound.js'

// Does `move` (on an opponent-to-move position `g`) still land its threat?
function threatDefused(g, threatUci, isMate) {
  if (!threatUci) return true
  const t = new Chess(g.fen())
  try { t.move({ from: threatUci.slice(0, 2), to: threatUci.slice(2, 4), promotion: 'q' }) }
  catch { return true } // the threatening move is no longer legal
  if (isMate) return !t.isCheckmate()
  const dest = threatUci.slice(2, 4)
  return t.moves({ verbose: true }).some(m => m.to === dest && m.captured) // recapture available
}

export default function Threats() {
  const [idx, setIdx] = useState(0)
  const [fen, setFen] = useState(THREATS[0].fen)
  const [phase, setPhase] = useState('identify') // identify | move | done
  const [chosen, setChosen] = useState(null)
  const [tries, setTries] = useState(0)
  const [moveMsg, setMoveMsg] = useState('')
  const [showSolution, setShowSolution] = useState(false)

  const t = THREATS[idx]
  const isMate = t.answerId === 'mate'
  const correctChoice = chosen === t.answerId
  const orientation = t.fen.includes(' b ') ? 'black' : 'white'

  function load(i) {
    const n = (i + THREATS.length) % THREATS.length
    setIdx(n); setFen(THREATS[n].fen); setPhase('identify'); setChosen(null); setTries(0); setMoveMsg(''); setShowSolution(false)
  }

  function choose(id) {
    if (chosen) return
    setChosen(id)
    if (id === t.answerId) { sound.correct(); setPhase('move'); setMoveMsg(t.answerId === 'none' ? 'Right — no threat. Develop a piece toward the centre.' : 'Correct! Now neutralise it on the board.') }
    else sound.wrong()
  }

  const onDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (phase !== 'move') return false
    const g = new Chess(fen)
    try { g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }) } catch { return false }
    if (t.answerId === 'none' || threatDefused(g, t.threatMove, isMate)) {
      setFen(g.fen()); sound.win(); setPhase('done'); return true
    }
    setTries(n => n + 1)
    setMoveMsg('That move doesn’t stop the threat. Look again — or reveal the key move.')
    sound.wrong()
    return false
  }, [phase, fen, t, isMate])

  // Threat arrow shown once the player has answered (so they can see it).
  const threatArrow = chosen && t.threatMove && phase !== 'done'
    ? [{ startSquare: t.threatMove.slice(0, 2), endSquare: t.threatMove.slice(2, 4), color: 'rgba(224,84,84,0.85)' }]
    : []
  const solutionArrow = showSolution && phase === 'move'
    ? [{ startSquare: t.solutionMove.slice(0, 2), endSquare: t.solutionMove.slice(2, 4), color: 'rgba(91,157,255,0.9)' }]
    : []

  return (
    <div>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Find the Threat 🛡️</h1>
        <p className="page-subtitle">Spot what your opponent is planning — then stop it. Trains the defensive vision that saves games.</p></div>

      <div className="layout-two-col">
        <div className="layout-board">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>{orientation === 'white' ? 'White' : 'Black'} to move</span>
            <span className="pill pill-muted">Position {idx + 1} / {THREATS.length}</span>
          </div>
          <Board position={fen} orientation={orientation} onDrop={onDrop} allowDragging={phase === 'move'} arrows={[...threatArrow, ...solutionArrow]} id="threats" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {phase === 'identify' && (
            <>
              <CoachPanel tone={chosen ? (correctChoice ? 'good' : 'bad') : 'info'} icon="🛡️"
                eyebrow={chosen ? (correctChoice ? 'Correct' : 'Not quite') : 'Question'}
                title="What is your opponent threatening?">
                {chosen
                  ? <p>{correctChoice ? 'Good eye. The red arrow shows the threat — now play a move to deal with it.' : `Look again — the red arrow shows what your opponent is actually planning.`}</p>
                  : <p>Study the position. If it were your opponent’s move, what would they do?</p>}
              </CoachPanel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {THREAT_CHOICES.map(c => {
                  const picked = chosen === c.id
                  const isAns = c.id === t.answerId
                  const cls = !chosen ? 'btn-secondary' : isAns ? 'btn-success' : picked ? 'btn-danger' : 'btn-secondary'
                  return (
                    <button key={c.id} className={cls} style={{ width: '100%', justifyContent: 'flex-start' }} disabled={!!chosen} onClick={() => choose(c.id)}>
                      {chosen && isAns ? '✓ ' : chosen && picked ? '✗ ' : ''}{c.text}
                    </button>
                  )
                })}
              </div>
              {chosen && !correctChoice && (
                <button className="btn-primary" onClick={() => setPhase('move')}>Continue →</button>
              )}
            </>
          )}

          {phase === 'move' && (
            <>
              <CoachPanel tone={tries > 0 ? 'warning' : 'coach'} icon="♟" eyebrow="Your move" title={t.answerId === 'none' ? 'Improve your position' : 'Neutralise the threat'}>
                <p>{moveMsg}</p>
              </CoachPanel>
              {tries >= 1 && t.answerId !== 'none' && (
                <button className="btn-gold" onClick={() => { setShowSolution(true); sound.click() }}>Show the key move</button>
              )}
              <button className="btn-secondary" onClick={() => { setFen(t.fen); setPhase('identify'); setChosen(null); setTries(0); setShowSolution(false); setMoveMsg('') }}>Restart position</button>
            </>
          )}

          {phase === 'done' && (
            <>
              <CoachPanel tone="good" icon="✓" eyebrow="Solved" title="Threat neutralised!"
                actions={<>
                  <button className="btn-primary" onClick={() => load(idx + 1)}>Next position →</button>
                  <button className="btn-secondary" onClick={() => load(idx)}>Replay</button>
                </>}>
                <p>{t.explanation}</p>
              </CoachPanel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
