// Spaced repetition for puzzle review, derived from the SM-2 algorithm.
//
// Instead of a binary "missed / not missed" flag, every solved-or-failed
// puzzle becomes a card with an ease factor and a due date. Cards you fail
// come back almost immediately; cards you nail keep getting pushed further
// out, so review time is spent where it actually moves your rating.
//
// All functions are pure — state lives in useStats — which keeps them easy
// to unit-test and reason about.

export const GRADE = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 }

const DAY = 86_400_000
const MIN_EASE = 1.3
const LAPSE_DELAY = 10 * 60 * 1000 // re-show a failed card in ~10 minutes

export function newCard(id, now = Date.now()) {
  return { id, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now }
}

// Apply a review outcome and return the updated card (never mutates input).
export function schedule(card, grade, now = Date.now()) {
  const c = card || newCard(undefined, now)
  let { ease, interval, reps, lapses } = c

  if (grade === GRADE.AGAIN) {
    // Failed: reset progress, ding the ease, and bring it back very soon.
    return { ...c, ease: Math.max(MIN_EASE, ease - 0.2), interval: 0, reps: 0, lapses: lapses + 1, due: now + LAPSE_DELAY }
  }

  if (grade === GRADE.HARD) ease = Math.max(MIN_EASE, ease - 0.15)
  else if (grade === GRADE.EASY) ease = ease + 0.15

  reps += 1
  if (reps === 1) interval = 1
  else if (reps === 2) interval = grade === GRADE.EASY ? 6 : 3
  else {
    const mult = grade === GRADE.HARD ? 0.8 : grade === GRADE.EASY ? 1.3 : 1
    interval = Math.round(interval * ease * mult)
  }
  interval = Math.max(1, interval)
  return { ...c, ease, interval, reps, lapses, due: now + interval * DAY }
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now
}

// Cards ready for review now, soonest-due first.
export function dueCards(cards, now = Date.now()) {
  return Object.values(cards || {})
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.due - b.due)
}

// Map a puzzle attempt onto a review grade.
export function gradeFromResult({ solved, firstTry, hintsUsed = 0 }) {
  if (!solved) return GRADE.AGAIN
  if (!firstTry || hintsUsed > 0) return GRADE.HARD
  return GRADE.GOOD
}
