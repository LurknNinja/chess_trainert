// Lightweight chess sound effects synthesised with the Web Audio API.
// No audio files required — keeps the bundle tiny and works offline.

const PREF_KEY = 'chess_trainer_sound'

let ctx = null
let enabled = loadPref()

function loadPref() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    return raw === null ? true : raw === '1'
  } catch {
    return true
  }
}

export function isSoundEnabled() {
  return enabled
}

export function setSoundEnabled(on) {
  enabled = !!on
  try { localStorage.setItem(PREF_KEY, enabled ? '1' : '0') } catch { /* ignore */ }
}

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // Browsers suspend the context until a user gesture; resume on demand.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Play a short tone. type: 'sine' | 'triangle' | 'square'
function tone(freq, duration = 0.09, { type = 'triangle', gain = 0.18, delay = 0 } = {}) {
  const ac = audioCtx()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  // Quick attack, smooth exponential decay for a soft "click" feel.
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function chord(freqs, duration, opts) {
  freqs.forEach((f, i) => tone(f, duration, { ...opts, delay: (opts?.delay ?? 0) + i * 0.05 }))
}

export const sound = {
  move()    { if (enabled) tone(320, 0.07, { type: 'triangle', gain: 0.14 }) },
  capture() { if (enabled) tone(180, 0.11, { type: 'square', gain: 0.16 }) },
  check()   { if (enabled) chord([660, 880], 0.12, { type: 'triangle', gain: 0.16 }) },
  castle()  { if (enabled) chord([300, 400], 0.1, { type: 'triangle', gain: 0.14 }) },
  promote() { if (enabled) chord([523, 659, 784], 0.14, { type: 'triangle', gain: 0.15 }) },
  correct() { if (enabled) chord([523, 784], 0.13, { type: 'sine', gain: 0.16 }) },
  wrong()   { if (enabled) tone(160, 0.18, { type: 'square', gain: 0.15 }) },
  win()     { if (enabled) chord([523, 659, 784, 1047], 0.18, { type: 'triangle', gain: 0.16 }) },
  lose()    { if (enabled) chord([330, 247], 0.22, { type: 'square', gain: 0.14 }) },
  click()   { if (enabled) tone(420, 0.04, { type: 'sine', gain: 0.08 }) },
}

// Inspect a chess.js verbose move + resulting game state and play the right cue.
export function playMoveSound(moveObj, gameAfter) {
  if (!moveObj) return
  const flags = moveObj.flags || ''
  if (gameAfter?.isCheckmate?.()) { sound.win(); return }
  if (gameAfter?.isCheck?.()) { sound.check(); return }
  if (flags.includes('p')) { sound.promote(); return }
  if (flags.includes('k') || flags.includes('q')) { sound.castle(); return }
  if (flags.includes('c') || flags.includes('e') || moveObj.captured) { sound.capture(); return }
  sound.move()
}
