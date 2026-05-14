import { useEffect, useRef, useCallback } from 'react'

export function useStockfish() {
  const worker = useRef(null)
  const handlers = useRef([])

  useEffect(() => {
    worker.current = new Worker('/stockfish.js')
    worker.current.postMessage('uci')
    worker.current.onmessage = (e) => {
      handlers.current.forEach(fn => fn(e.data))
    }
    return () => worker.current?.terminate()
  }, [])

  const send = useCallback((cmd) => {
    worker.current?.postMessage(cmd)
  }, [])

  const onMessage = useCallback((fn) => {
    handlers.current.push(fn)
    return () => { handlers.current = handlers.current.filter(h => h !== fn) }
  }, [])

  return { send, onMessage }
}
