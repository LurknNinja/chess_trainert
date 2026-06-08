import { useState, useRef } from 'react'
import Nav from './components/Nav.jsx'
import Home from './components/Home.jsx'
import Learn from './modes/Learn.jsx'
import Puzzles from './modes/Puzzles.jsx'
import Engine from './modes/Engine.jsx'
import Openings from './modes/Openings.jsx'
import Endgames from './modes/Endgames.jsx'
import PieceGuide from './modes/PieceGuide.jsx'
import Progress from './modes/Progress.jsx'

const MODES = { home: Home, learn: Learn, puzzles: Puzzles, engine: Engine, openings: Openings, endgames: Endgames, pieces: PieceGuide, progress: Progress }

export default function App() {
  const [mode, setMode] = useState('home')
  const trainModeRef = useRef(false)

  function handleNav(target) {
    if (target === 'puzzles-train') {
      trainModeRef.current = true
      setMode('puzzles')
    } else {
      trainModeRef.current = false
      setMode(target)
    }
  }

  const Mode = MODES[mode] || Home
  const extraProps = mode === 'puzzles' ? { initialTrainMode: trainModeRef.current } : {}

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav current={mode} onNav={handleNav} />
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Mode onNav={handleNav} {...extraProps} />
      </main>
    </div>
  )
}
