// Minimal UCI driver for Stockfish, usable from Node build/CI scripts.
// This is what makes the *engine* the source of truth for puzzle/line
// correctness instead of hand-typed solutions or geometric guesses.
//
//   const eng = await Engine.start()
//   const { bestmove, scoreCp, mate, pv } = await eng.analyse(fen, { depth: 16 })
//   await eng.quit()
//
// scoreCp / mate are always reported from the side-to-move's point of view
// (positive = good for the player on move), matching UCI convention.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// The single-threaded lite build is the most reliable to drive headless.
function enginePath() {
  const pkg = require.resolve('stockfish/package.json')
  const dir = pkg.slice(0, pkg.lastIndexOf('/'))
  return `${dir}/bin/stockfish-18-lite-single.js`
}

export class Engine {
  constructor(proc) {
    this.proc = proc
    this.buf = ''
    this.waiters = []
    proc.stdout.on('data', (d) => {
      this.buf += d.toString()
      let idx
      while ((idx = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, idx).trim()
        this.buf = this.buf.slice(idx + 1)
        if (line) this._onLine(line)
      }
    })
  }

  static async start() {
    const proc = spawn(process.execPath, [enginePath()], { stdio: ['pipe', 'pipe', 'ignore'] })
    const eng = new Engine(proc)
    eng._send('uci')
    await eng._until((l) => l === 'uciok')
    eng._send('isready')
    await eng._until((l) => l === 'readyok')
    return eng
  }

  _send(cmd) { this.proc.stdin.write(cmd + '\n') }

  _onLine(line) {
    for (const w of this.waiters) w(line)
  }

  // Resolve when `match(line)` is truthy; returns that line.
  _until(match) {
    return new Promise((resolve) => {
      const fn = (line) => {
        if (match(line)) {
          this.waiters = this.waiters.filter((x) => x !== fn)
          resolve(line)
        }
      }
      this.waiters.push(fn)
    })
  }

  // Analyse a FEN. Returns { bestmove, scoreCp, mate, pv } from the
  // side-to-move's perspective. `mate` is signed plies-to-mate or null.
  async analyse(fen, { depth = 16, movetime } = {}) {
    let scoreCp = null
    let mate = null
    let pv = []
    const collector = (line) => {
      if (!line.startsWith('info') || !line.includes(' pv ')) return
      const cp = / score cp (-?\d+)/.exec(line)
      const mt = / score mate (-?\d+)/.exec(line)
      const pvm = / pv (.+)$/.exec(line)
      if (cp) { scoreCp = Number(cp[1]); mate = null }
      if (mt) { mate = Number(mt[1]); scoreCp = null }
      if (pvm) pv = pvm[1].trim().split(/\s+/)
    }
    this.waiters.push(collector)
    this._send('ucinewgame')
    this._send(`position fen ${fen}`)
    this._send(movetime ? `go movetime ${movetime}` : `go depth ${depth}`)
    const best = await this._until((l) => l.startsWith('bestmove'))
    this.waiters = this.waiters.filter((x) => x !== collector)
    const bestmove = best.split(/\s+/)[1]
    return { bestmove, scoreCp, mate, pv }
  }

  async quit() {
    this._send('quit')
    await new Promise((r) => { this.proc.on('exit', r); setTimeout(r, 500) })
  }
}
