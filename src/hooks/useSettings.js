import { useState, useEffect } from 'react'

const KEY = 'chess_trainer_settings'

// Board colour themes (light/dark square fills + accent for highlights).
export const THEMES = {
  classic: { name: 'Classic', light: '#F0D9B5', dark: '#B58863', accent: 'rgba(255,200,0,0.45)' },
  green:   { name: 'Green',   light: '#EEEED2', dark: '#769656', accent: 'rgba(255,210,40,0.5)' },
  blue:    { name: 'Blue',    light: '#DEE3E6', dark: '#8CA2AD', accent: 'rgba(255,200,0,0.5)' },
  slate:   { name: 'Slate',   light: '#C7CBD6', dark: '#5B6273', accent: 'rgba(120,180,255,0.55)' },
  coral:   { name: 'Coral',   light: '#F3D9C8', dark: '#C06B4F', accent: 'rgba(255,225,120,0.5)' },
}

const DEFAULTS = {
  theme: 'classic',
  showLegalMoves: true,
  showLastMove: true,
  highlightCheck: true,
  animationMs: 200,
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULTS, ...parsed, theme: THEMES[parsed.theme] ? parsed.theme : 'classic' }
  } catch {
    return { ...DEFAULTS }
  }
}

let state = load()
const listeners = new Set()

export function getSettings() { return state }

export function setSettings(patch) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  listeners.forEach(fn => fn(state))
}

// React hook: re-renders the component whenever settings change anywhere.
export function useSettings() {
  const [s, setS] = useState(state)
  useEffect(() => {
    const fn = (next) => setS(next)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])
  return s
}
