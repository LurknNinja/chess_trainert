import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLichessDaily, isLegalUci, uciToMove } from './lichess.js'

// A 3-ply PGN (e4, e5, Nf3) used across several tests.
const PGN_3PLY = '1. e4 e5 2. Nf3'

function mockFetch(body, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ── isLegalUci ─────────────────────────────────────────────────────────────

describe('isLegalUci', () => {
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

  it('accepts a legal pawn push', () => {
    expect(isLegalUci(START, 'e2e4')).toBe(true)
  })

  it('rejects an illegal move (wrong side)', () => {
    expect(isLegalUci(START, 'e7e5')).toBe(false)
  })

  it('accepts a legal black response', () => {
    expect(isLegalUci(AFTER_E4, 'e7e5')).toBe(true)
  })

  it('rejects a physically impossible move', () => {
    expect(isLegalUci(START, 'a1a8')).toBe(false)
  })
})

// ── uciToMove ──────────────────────────────────────────────────────────────

describe('uciToMove', () => {
  it('parses a normal move', () => {
    expect(uciToMove('e2e4')).toEqual({ from: 'e2', to: 'e4', promotion: undefined })
  })

  it('parses a promotion', () => {
    expect(uciToMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
  })
})

// ── fetchLichessDaily ──────────────────────────────────────────────────────

describe('fetchLichessDaily', () => {
  it('returns null on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns null when response is not ok', async () => {
    mockFetch({}, false)
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns null when solution array is empty', async () => {
    mockFetch({
      puzzle: { solution: [], themes: ['fork'], rating: 1500, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns null when solution is missing', async () => {
    mockFetch({
      puzzle: { themes: ['fork'], rating: 1500, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns null when initialPly exceeds game length', async () => {
    mockFetch({
      puzzle: { solution: ['e7e5'], themes: ['fork'], rating: 1500, initialPly: 99 },
      game: { pgn: PGN_3PLY },
    })
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns a normalized puzzle object for a valid response', async () => {
    // initialPly=1: play e4, then black's solution e7e5 is legal
    mockFetch({
      puzzle: { solution: ['e7e5'], themes: ['fork', 'middlegame'], rating: 1600, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    const result = await fetchLichessDaily()
    expect(result).not.toBeNull()
    expect(result.id).toBe('lichess-daily')
    expect(result.daily).toBe(true)
    expect(result.rating).toBe(1600)
    expect(result.moves).toEqual(['e7e5'])
    expect(result.theme).toBe('fork')
    expect(result.description).toMatch(/lichess/i)
  })

  it('defaults rating to 1500 when omitted', async () => {
    mockFetch({
      puzzle: { solution: ['e7e5'], themes: ['pin'], initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    const result = await fetchLichessDaily()
    expect(result?.rating).toBe(1500)
  })

  it('defaults theme to "tactics" when themes array is absent', async () => {
    mockFetch({
      puzzle: { solution: ['e7e5'], rating: 1500, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    const result = await fetchLichessDaily()
    expect(result?.theme).toBe('tactics')
  })

  it('converts camelCase themes to spaced strings', async () => {
    mockFetch({
      puzzle: { solution: ['e7e5'], themes: ['backRankMate'], rating: 1500, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    const result = await fetchLichessDaily()
    expect(result?.theme).toBe('back Rank Mate')
  })

  it('resolves the off-by-one ply via the extra-move fallback', async () => {
    // initialPly=0 → starting position (white to move) → "e7e5" is illegal.
    // Fallback plays verboseMoves[0] (e4) → now black to move → "e7e5" is legal.
    mockFetch({
      puzzle: { solution: ['e7e5'], themes: ['tactics'], rating: 1400, initialPly: 0 },
      game: { pgn: PGN_3PLY },
    })
    const result = await fetchLichessDaily()
    expect(result).not.toBeNull()
    expect(result.moves).toEqual(['e7e5'])
  })

  it('returns null when solution is illegal even after the extra-move fallback', async () => {
    // "a1a8" is never a legal move in a normal opening position.
    mockFetch({
      puzzle: { solution: ['a1a8'], themes: ['tactics'], rating: 1500, initialPly: 1 },
      game: { pgn: PGN_3PLY },
    })
    expect(await fetchLichessDaily()).toBeNull()
  })

  it('returns null when solution is illegal and no fallback move exists', async () => {
    // initialPly equals the total ply count → no extra move to try.
    mockFetch({
      puzzle: { solution: ['a1a8'], themes: ['tactics'], rating: 1500, initialPly: 3 },
      game: { pgn: PGN_3PLY },
    })
    expect(await fetchLichessDaily()).toBeNull()
  })
})
