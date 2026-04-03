import { useEffect, useMemo, useRef, useState } from 'react'

type Lap = { id: string; ms: number; splitMs: number }

function nowMs() {
  return performance.now()
}

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  const centis = Math.floor((total % 1000) / 10)
  return `${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`
}

export function StopwatchView() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<Lap[]>([])

  const startRef = useRef<number | null>(null)
  const baseRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const pretty = useMemo(() => formatMs(elapsed), [elapsed])

  useEffect(() => {
    if (!running) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    const loop = () => {
      const start = startRef.current
      if (start == null) return
      setElapsed(baseRef.current + (nowMs() - start))
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [running])

  function start() {
    if (running) return
    startRef.current = nowMs()
    setRunning(true)
  }

  function stop() {
    if (!running) return
    const start = startRef.current
    if (start != null) baseRef.current = baseRef.current + (nowMs() - start)
    startRef.current = null
    setRunning(false)
    setElapsed(baseRef.current)
  }

  function reset() {
    setRunning(false)
    startRef.current = null
    baseRef.current = 0
    setElapsed(0)
    setLaps([])
  }

  function lap() {
    const currentMs = elapsed
    const prev = laps[0]?.ms ?? 0
    const split = currentMs - prev
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setLaps((l) => [{ id, ms: currentMs, splitMs: split }, ...l].slice(0, 30))
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="gt-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stopwatch</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Accurate, smooth updates with laps.</div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200/90 bg-zinc-50/90 px-6 py-10 text-center dark:border-white/10 dark:bg-black/30">
          <div className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">{pretty}</div>
          <div className="mt-2 text-xs text-zinc-500">mm:ss.cc</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!running ? (
            <button type="button" className="gt-btn gt-btn-primary" onClick={start}>
              Start
            </button>
          ) : (
            <button type="button" className="gt-btn gt-btn-primary" onClick={stop}>
              Stop
            </button>
          )}
          <button type="button" className="gt-btn" onClick={lap} disabled={!running}>
            Lap
          </button>
          <button type="button" className="gt-btn" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className="gt-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Laps</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Latest lap on top.</div>
          </div>
          <button type="button" className="gt-btn" onClick={() => setLaps([])} disabled={laps.length === 0}>
            Clear
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {laps.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              Record a lap while running.
            </div>
          ) : (
            laps.map((l, idx) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/5"
              >
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Lap {laps.length - idx}</div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatMs(l.ms)}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">+{formatMs(l.splitMs)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

