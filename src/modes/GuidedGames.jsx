import { useState } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { GUIDED_GAMES } from '../data/guidedGames.js'
import { fenForStep, uciToMove, getGuided, saveGuidedStep, saveGuidedComplete } from '../utils/guidedGameHelpers.js'
import { sound, playMoveSound } from '../utils/sound.js'

const START = new Chess().fen()
const GOLD = 'rgba(242,201,76,0.45)'

export default function GuidedGames({ onNav }) {
  const [gameId, setGameId] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [fen, setFen] = useState(START)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState('')
  const [showArrow, setShowArrow] = useState(true)
  const [progress, setProgress] = useState(() => getGuided())

  const game = GUIDED_GAMES.find(g => g.id === gameId) || null
  const steps = game?.steps || []
  const step = steps[stepIdx]

  function openGame(id) {
    setGameId(id); setStepIdx(0); setFen(START); setDone(false); setBusy(false); setWrong(''); setShowArrow(true)
    sound.click()
  }
  function backToList() { setGameId(null); setProgress(getGuided()) }
  function restart() { setStepIdx(0); setFen(START); setDone(false); setBusy(false); setWrong('') }
  function prevStep() {
    if (stepIdx === 0) return
    const i = stepIdx - 1
    setStepIdx(i); setFen(fenForStep(steps, i)); setDone(false); setWrong(''); setBusy(false)
  }

  function onDrop({ sourceSquare, targetSquare }) {
    if (done || busy || !step) return false
    if (sourceSquare + targetSquare !== step.move.slice(0, 4)) {
      setWrong('Not that move yet. In a guided walkthrough we’re practising one specific plan — follow the arrow.')
      sound.wrong()
      return false
    }
    const g = new Chess(fen)
    let m
    try { m = g.move(uciToMove(step.move)) } catch { return false }
    setFen(g.fen()); setWrong('')
    playMoveSound(m, g)

    const finish = () => {
      const next = stepIdx + 1
      if (next >= steps.length) {
        setDone(true); setProgress(saveGuidedComplete(game.id)); sound.win()
      } else {
        setStepIdx(next); saveGuidedStep(game.id, next)
      }
    }

    if (step.reply) {
      setBusy(true)
      setTimeout(() => {
        try { const rm = g.move(uciToMove(step.reply)); setFen(g.fen()); playMoveSound(rm, g) } catch { /* ignore */ }
        setBusy(false); finish()
      }, 550)
    } else {
      finish() // final move (checkmate) — no reply
    }
    return true
  }

  // ── Walkthrough picker ──────────────────────────────────────────────────────
  if (!game) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Guided Games</h1>
          <p className="page-subtitle">Paint-by-numbers chess: make each move and learn why it works.</p>
        </div>
        <div className="mode-grid">
          {GUIDED_GAMES.map(g => {
            const completed = progress.completed[g.id]
            const last = progress.lastStep[g.id] || 0
            return (
              <button key={g.id} className="mode-card" onClick={() => openGame(g.id)}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="pill pill-blue">{g.level}</span>
                  <span className="pill pill-muted">{g.style}</span>
                  {completed
                    ? <span className="pill pill-green">✓ Completed</span>
                    : last > 0 ? <span className="pill pill-gold">In progress</span> : null}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{g.title}</div>
                <div className="muted" style={{ fontSize: 13, flex: 1 }}>{g.goal}</div>
                <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>Start walkthrough →</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const squareStyles = !done && step ? { [step.highlight[0]]: { background: GOLD }, [step.highlight[1]]: { background: GOLD } } : {}
  const arrows = !done && step && showArrow ? [{ startSquare: step.arrow[0], endSquare: step.arrow[1], color: 'rgba(242,201,76,0.9)' }] : []

  return (
    <div>
      <button className="btn-ghost" onClick={backToList} style={{ marginBottom: 12, padding: '6px 12px', minHeight: 36 }}>← All walkthroughs</button>
      <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)', marginBottom: 2 }}>{game.title}</h1>
      <p className="tiny-label" style={{ marginBottom: 16 }}>{game.level} · {game.style}</p>

      <div className="layout-two-col">
        <div className="layout-board">
          <Board position={fen} orientation="white" onDrop={onDrop} allowDragging={!done && !busy} squareStyles={squareStyles} arrows={arrows} id="guided" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}><ProgressBar value={done ? steps.length : stepIdx} max={steps.length} color={done ? 'var(--success)' : undefined} /></div>
            <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Step {Math.min(stepIdx + 1, steps.length)} / {steps.length}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {done ? (
            <CoachPanel tone="good" icon="🎉" eyebrow="Walkthrough complete" title="Well played!"
              actions={<>
                <button className="btn-primary" onClick={restart}>Replay</button>
                {game.id === 'first-game' && <button className="btn-gold" onClick={() => openGame('first-game-strategy')}>Try the strategy version →</button>}
                <button className="btn-secondary" onClick={() => onNav('puzzles')}>Go to Puzzles</button>
                <button className="btn-secondary" onClick={() => onNav('threats')}>Find the Threat</button>
                <button className="btn-secondary" onClick={() => onNav('openings')}>Explore Openings</button>
                <button className="btn-secondary" onClick={() => onNav('endgames')}>Endgame Practice</button>
              </>}>
              <p>{game.summary}</p>
            </CoachPanel>
          ) : (
            <>
              <CoachPanel tone={wrong ? 'bad' : step.checkpoint === 'Checkmate' ? 'coach' : 'info'}
                icon={wrong ? '💡' : '♟'} eyebrow={step.checkpoint || `Step ${stepIdx + 1}`} title={step.title}>
                {wrong
                  ? <p>{wrong}</p>
                  : <>
                      <p>{step.instruction}</p>
                      <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--text)' }}>Why:</strong> {step.why}</p>
                      {step.strategyNote && <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--accent)' }}>Coach:</strong> {step.strategyNote}</p>}
                      {step.beginnerTip && <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--gold)' }}>Tip:</strong> {step.beginnerTip}</p>}
                      {step.opponentPlan && <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--text)' }}>Opponent:</strong> {step.opponentPlan}</p>}
                      {step.plan && <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--accent)' }}>Plan:</strong> {step.plan}</p>}
                      {step.matePattern && <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--success)' }}>Pattern:</strong> {step.matePattern}</p>}
                      {step.mistakeWarning && <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>{step.mistakeWarning}</p>}
                    </>}
              </CoachPanel>
              <div className="button-row">
                <button className="btn-gold" onClick={() => setShowArrow(s => !s)}>{showArrow ? 'Hide move arrow' : 'Show move arrow'}</button>
                <button className="btn-secondary" onClick={prevStep} disabled={stepIdx === 0 || busy}>← Previous</button>
                <button className="btn-secondary" onClick={restart}>Restart</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
