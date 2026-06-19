import { useEffect, useRef, useCallback, useState } from 'react'

export function useStockfish() {
  const worker = useRef(null)
  const handlers = useRef([])
  const [engineError, setEngineError] = useState(null)

  useEffect(() => {
    try {
      worker.current = new Worker(import.meta.env.BASE_URL + 'stockfish.js')
      worker.current.onerror = () => setEngineError('Engine failed to load')
      worker.current.onmessage = (e) => {
        handlers.current.forEach(fn => fn(e.data))
      }
      worker.current.postMessage('uci')
    } catch {
      setEngineError('Web Workers not supported')
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

  return { send, onMessage, engineError }
}
