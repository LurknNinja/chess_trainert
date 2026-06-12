import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import CoachPanel from '../components/CoachPanel.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { OPENINGS, OPENING_NOTES } from '../data/openings.js'
import { playMoveSound, sound } from '../utils/sound.js'

function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

function buildPositions(opening) {
  const positions = []
  const g = new Chess()
  positions.push({ fen: g.fen(), description: 'Starting position. Step through the moves →' })
  for (let i = 0; i < opening.moves.length; i++) {
    g.move(uciToMove(opening.moves[i]))
    positions.push({ fen: g.fen(), description: opening.descriptions[i] || '' })
  }
  return positions
}

const START_FEN = new Chess().fen()
const DRILL_HINTS = ['Hint: the plan', 'Hint: which piece', 'Hint: show the move']

export default function Openings() {
  const [openingIdx, setOpeningIdx] = useState(0)
  const [positions, setPositions] = useState(() => buildPositions(OPENINGS[0]))
  const [posIdx, setPosIdx] = useState(0)
  const [mode, setMode] = useState('learn') // learn | drill
  const [drillFen, setDrillFen] = useState(START_FEN)
  const [drillStep, setDrillStep] = useState(0)
  const [drillMsg, setDrillMsg] = useState('')
  const [drillBad, setDrillBad] = useState(false)
  const [drillHint, setDrillHint] = useState(0)
  const [trainerThinking, setTrainerThinking] = useState(false)

  const opening = OPENINGS[openingIdx]
  const notes = OPENING_NOTES[opening.id] || {}

  function selectOpening(i) {
    setOpeningIdx(i)
    setPositions(buildPositions(OPENINGS[i]))
    setPosIdx(0); setMode('learn')
    setDrillFen(START_FEN); setDrillStep(0); setDrillMsg(''); setDrillBad(false); setDrillHint(0); setTrainerThinking(false)
  }

  function startDrill() {
    setMode('drill'); setDrillFen(START_FEN); setDrillStep(0)
    setDrillMsg(`You play ${opening.color}. Play the opening from memory.`); setDrillBad(false); setDrillHint(0); setTrainerThinking(false)
  }

  useEffect(() => {
    if (mode !== 'drill' || drillStep >= opening.moves.length) return
    const g = new Chess(drillFen)
    const playerTurn = opening.color === 'white' ? 'w' : 'b'
    if (g.turn() === playerTurn) return
    setTrainerThinking(true)
    const timer = setTimeout(() => {
      const g2 = new Chess(drillFen)
      let tm
      try { tm = g2.move(uciToMove(opening.moves[drillStep])) } catch { setTrainerThinking(false); return }
      const afterStep = drillStep + 1
      setDrillFen(g2.fen()); playMoveSound(tm, g2); setDrillStep(afterStep); setTrainerThinking(false); setDrillHint(0)
      setDrillBad(false)
      setDrillMsg(afterStep >= opening.moves.length ? '✓ Opening complete! Well done.' : 'Your turn — find the right move.')
    }, 500)
    return () => clearTimeout(timer)
  }, [mode, drillFen, drillStep, opening])

  const onDrillDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (trainerThinking || drillStep >= opening.moves.length) return false
    const g = new Chess(drillFen)
    const playerTurn = opening.color === 'white' ? 'w' : 'b'
    if (g.turn() !== playerTurn) return false
    const expected = opening.moves[drillStep]
    if (sourceSquare + targetSquare !== expected.slice(0, 4)) {
      setDrillBad(true)
      setDrillMsg('Not the main line. Think about the opening’s plan — or tap a hint.')
      sound.wrong()
      return false
    }
    const g2 = new Chess(drillFen)
    let pm
    try { pm = g2.move(uciToMove(expected)) } catch { return false }
    const nextStep = drillStep + 1
    setDrillFen(g2.fen()); playMoveSound(pm, g2); setDrillStep(nextStep); setDrillHint(0); setDrillBad(false)
    setDrillMsg(nextStep >= opening.moves.length ? '✓ Opening complete! Well done.' : '✓ Correct!')
    return true
  }, [drillFen, drillStep, opening, trainerThinking])

  const playerTurn = opening.color === 'white' ? 'w' : 'b'
  const isMyDrillTurn = drillStep < opening.moves.length && new Chess(drillFen).turn() === playerTurn
  const expected = opening.moves[drillStep]
  const drillSquares = drillHint >= 2 && isMyDrillTurn && expected ? { [expected.slice(0, 2)]: { background: 'rgba(242,201,76,0.5)', borderRadius: '50%' } } : {}
  const drillArrow = drillHint >= 3 && isMyDrillTurn && expected ? [{ startSquare: expected.slice(0, 2), endSquare: expected.slice(2, 4), color: 'rgba(242,201,76,0.85)' }] : []
  const learnArrow = posIdx < positions.length - 1 && opening.moves[posIdx]
    ? [{ startSquare: opening.moves[posIdx].slice(0, 2), endSquare: opening.moves[posIdx].slice(2, 4), color: 'var(--accent)' }] : []

  // ── Opening picker (compact cards) ──────────────────────────────────────────
  const Picker = () => (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
      {OPENINGS.map((o, i) => {
        const active = openingIdx === i
        const n = OPENING_NOTES[o.id] || {}
        return (
          <button key={o.id} onClick={() => selectOpening(i)} className="card-hover"
            style={{ flex: '0 0 auto', width: 150, textAlign: 'left', padding: 14, borderRadius: 'var(--radius-md)',
              background: active ? 'var(--surface-2)' : 'var(--surface)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column', gap: 6, minHeight: 44 }} aria-pressed={active}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{o.name}</span>
            <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span className={`pill ${o.color === 'white' ? 'pill-muted' : 'pill-blue'}`}>{o.color}</span>
              {n.difficulty && <span className="pill pill-muted">{n.difficulty}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )

  if (mode === 'drill') {
    const isDone = drillStep >= opening.moves.length
    return (
      <div>
        <div className="page-header"><h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Opening Trainer · Drill</h1>
          <p className="page-subtitle">{opening.name} — you play {opening.color}. Recall the moves from memory.</p></div>
        <div className="layout-two-col">
          <div className="layout-board">
            <Board position={drillFen} orientation={opening.color} onDrop={onDrillDrop} allowDragging={!isDone && !trainerThinking} squareStyles={drillSquares} arrows={drillArrow} id="opening-drill" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}><ProgressBar value={Math.min(drillStep, opening.moves.length)} max={opening.moves.length} color={isDone ? 'var(--success)' : undefined} /></div>
              <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{Math.min(drillStep, opening.moves.length)} / {opening.moves.length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CoachPanel tone={isDone ? 'good' : drillBad ? 'bad' : 'info'} icon={isDone ? '🎉' : drillBad ? '💡' : '♟'}
              eyebrow={isDone ? 'Complete' : trainerThinking ? 'Opponent moving…' : 'Your move'} title={isDone ? 'Opening complete!' : undefined}>
              <p>{drillMsg}</p>
              {drillHint >= 1 && !isDone && notes.mainIdea && <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--gold)' }}>Plan:</strong> {notes.mainIdea}</p>}
              {isDone && notes.plans && <ul style={{ margin: '8px 0 0 18px' }}>{notes.plans.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}</ul>}
            </CoachPanel>
            {!isDone && isMyDrillTurn && drillHint < 3 && (
              <button className="btn-gold" style={{ width: '100%' }} onClick={() => { setDrillHint(h => h + 1); sound.click() }}>{DRILL_HINTS[drillHint]}</button>
            )}
            <div className="button-row">
              <button className="btn-secondary" onClick={startDrill}>Restart</button>
              <button className="btn-secondary" onClick={() => setMode('learn')}>Back to learn</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 'var(--fs-xl)' }}>Opening Trainer</h1>
        <p className="page-subtitle">Learn the ideas behind your openings, then drill the moves.</p></div>
      <Picker />
      <div className="layout-two-col">
        <div className="layout-board">
          <Board position={positions[posIdx]?.fen} orientation={opening.color} allowDragging={false} interactive={false} arrows={learnArrow} id="opening-learn" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}><ProgressBar value={posIdx} max={positions.length - 1} /></div>
            <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Move {posIdx} / {positions.length - 1}</span>
          </div>
          <div className="button-row" style={{ marginTop: 12 }}>
            <button className="btn-secondary" onClick={() => setPosIdx(Math.max(0, posIdx - 1))} disabled={posIdx === 0}>← Prev</button>
            <button className="btn-primary" onClick={() => setPosIdx(Math.min(positions.length - 1, posIdx + 1))} disabled={posIdx === positions.length - 1}>Next →</button>
            <button className="btn-success" onClick={startDrill}>Drill this opening</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CoachPanel tone="info" icon="📖" eyebrow={`${opening.name}${notes.difficulty ? ` · ${notes.difficulty}` : ''}`} title={notes.mainIdea}>
            <p>{positions[posIdx]?.description}</p>
          </CoachPanel>
          {notes.plans && (
            <div className="panel">
              <p className="section-title" style={{ color: 'var(--accent)' }}>Plans for {opening.color}</p>
              <ul style={{ margin: '0 0 0 18px', color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.6 }}>
                {notes.plans.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
              </ul>
            </div>
          )}
          {notes.commonMistakes && (
            <div className="panel">
              <p className="section-title" style={{ color: 'var(--danger)' }}>Common mistakes</p>
              <ul style={{ margin: '0 0 0 18px', color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.6 }}>
                {notes.commonMistakes.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
