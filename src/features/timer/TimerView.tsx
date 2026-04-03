import { useEffect, useMemo, useRef, useState } from 'react'

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  return `${pad2(minutes)}:${pad2(seconds)}`
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    const t0 = ctx.currentTime
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6)
    o.stop(t0 + 0.65)
    o.onended = () => void ctx.close()
  } catch {
    // ignore
  }
}

export function TimerView() {
  const [min, setMin] = useState(5)
  const [sec, setSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [remainingMs, setRemainingMs] = useState(5 * 60_000)
  const [done, setDone] = useState(false)

  const endAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const pretty = useMemo(() => formatMs(remainingMs), [remainingMs])
  const totalMs = useMemo(() => clampInt(min, 0, 99) * 60_000 + clampInt(sec, 0, 59) * 1000, [min, sec])

  useEffect(() => {
    if (running) return
    setRemainingMs(totalMs)
    setDone(false)
  }, [totalMs, running])

  useEffect(() => {
    if (!running) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    const loop = () => {
      const endAt = endAtRef.current
      if (endAt == null) return
      const left = endAt - performance.now()
      if (left <= 0) {
        setRemainingMs(0)
        setRunning(false)
        setDone(true)
        endAtRef.current = null
        beep()
        return
      }
      setRemainingMs(left)
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
    if (remainingMs <= 0) return
    endAtRef.current = performance.now() + remainingMs
    setRunning(true)
    setDone(false)
  }

  function pause() {
    if (!running) return
    const endAt = endAtRef.current
    if (endAt != null) setRemainingMs(Math.max(0, endAt - performance.now()))
    endAtRef.current = null
    setRunning(false)
  }

  function reset() {
    endAtRef.current = null
    setRunning(false)
    setDone(false)
    setRemainingMs(totalMs)
  }

  function preset(minutes: number) {
    setMin(minutes)
    setSec(0)
    setRunning(false)
    setDone(false)
    setRemainingMs(minutes * 60_000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="gt-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Countdown Timer</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Simple presets, smooth countdown, optional beep.</div>
          </div>
        </div>

        <div
          className={[
            'mt-6 rounded-3xl border bg-zinc-50/90 px-6 py-10 text-center transition dark:bg-black/30',
            done
              ? 'border-emerald-500/40 ring-2 ring-emerald-400/25 dark:border-emerald-400/30 dark:ring-emerald-400/20'
              : 'border-zinc-200/90 dark:border-white/10',
          ].join(' ')}
        >
          <div className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">{pretty}</div>
          <div className="mt-2 text-xs text-zinc-500">mm:ss</div>
          {done && (
            <div className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">Time’s up.</div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Minutes</label>
            <input
              className="gt-input mt-1"
              value={min}
              inputMode="numeric"
              onChange={(e) => setMin(clampInt(Number(e.target.value || 0), 0, 99))}
              disabled={running}
            />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Seconds</label>
            <input
              className="gt-input mt-1"
              value={sec}
              inputMode="numeric"
              onChange={(e) => setSec(clampInt(Number(e.target.value || 0), 0, 59))}
              disabled={running}
            />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            {!running ? (
              <button type="button" className="gt-btn gt-btn-primary w-full" onClick={start}>
                Start
              </button>
            ) : (
              <button type="button" className="gt-btn gt-btn-primary w-full" onClick={pause}>
                Pause
              </button>
            )}
            <button type="button" className="gt-btn w-full" onClick={reset}>
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 3, 5, 10, 15, 25].map((m) => (
            <button key={m} type="button" className="gt-btn" onClick={() => preset(m)} disabled={running}>
              {m}m
            </button>
          ))}
          <button type="button" className="gt-btn" onClick={beep}>
            Test sound
          </button>
        </div>
      </div>

      <div className="gt-card p-5 sm:p-6">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">How it works</div>
        <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            The timer uses <span className="text-zinc-800 dark:text-zinc-200">requestAnimationFrame</span> for smooth
            updates and relies on an absolute end timestamp for accuracy.
          </p>
          <p>
            If the browser blocks audio autoplay, click <span className="text-zinc-800 dark:text-zinc-200">Test sound</span>{' '}
            once to grant permission.
          </p>
        </div>
      </div>
    </div>
  )
}

