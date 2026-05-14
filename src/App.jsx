import { useState } from 'react'
import Nav from './components/Nav.jsx'
import Home from './components/Home.jsx'
import Puzzles from './modes/Puzzles.jsx'
import Engine from './modes/Engine.jsx'
import Openings from './modes/Openings.jsx'
import Endgames from './modes/Endgames.jsx'

const MODES = { home: Home, puzzles: Puzzles, engine: Engine, openings: Openings, endgames: Endgames }

export default function App() {
  const [mode, setMode] = useState('home')
  const Mode = MODES[mode] || Home
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav current={mode} onNav={setMode} />
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Mode onNav={setMode} />
      </main>
    </div>
  )
}
