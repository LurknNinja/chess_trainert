import { useState, useRef } from 'react'
import Nav from './components/Nav.jsx'
import Home from './components/Home.jsx'
import Learn from './modes/Learn.jsx'
import GuidedGames from './modes/GuidedGames.jsx'
import Puzzles from './modes/Puzzles.jsx'
import PuzzleRush from './modes/PuzzleRush.jsx'
import Engine from './modes/Engine.jsx'
import Threats from './modes/Threats.jsx'
import Openings from './modes/Openings.jsx'
import Endgames from './modes/Endgames.jsx'
import PieceGuide from './modes/PieceGuide.jsx'
import Progress from './modes/Progress.jsx'
import Settings from './modes/Settings.jsx'
import Glossary from './modes/Glossary.jsx'

const MODES = { home: Home, learn: Learn, guided: GuidedGames, puzzles: Puzzles, rush: PuzzleRush, engine: Engine, threats: Threats, openings: Openings, endgames: Endgames, pieces: PieceGuide, progress: Progress, glossary: Glossary, settings: Settings }

export default function App() {
  const [mode, setMode] = useState('home')
  const trainModeRef = useRef(false)
  const reviewModeRef = useRef(false)

  function handleNav(target) {
    if (target === 'puzzles-train') {
      trainModeRef.current = true
      reviewModeRef.current = false
      setMode('puzzles')
    } else if (target === 'puzzles-review') {
      reviewModeRef.current = true
      trainModeRef.current = false
      setMode('puzzles')
    } else {
      trainModeRef.current = false
      reviewModeRef.current = false
      setMode(target)
    }
  }

  const Mode = MODES[mode] || Home
  const extraProps = mode === 'puzzles'
    ? { initialTrainMode: trainModeRef.current, initialReviewMode: reviewModeRef.current }
    : {}

  return (
    <div className="app-shell">
      <Nav current={mode} onNav={handleNav} />
      <main className="page">
        <Mode onNav={handleNav} {...extraProps} />
      </main>
    </div>
  )
}
