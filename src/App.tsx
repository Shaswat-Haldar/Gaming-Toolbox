import { useEffect, useMemo, useState } from 'react'
import { CalculatorView } from './features/calculator/CalculatorView'
import { StopwatchView } from './features/stopwatch/StopwatchView'
import { TimerView } from './features/timer/TimerView'
import { SudokuView } from './features/sudoku/SudokuView'
import { TicTacToeView } from './features/tictactoe/TicTacToeView'

type RouteId = 'home' | 'calculator' | 'stopwatch' | 'timer' | 'sudoku' | 'tictactoe'

type NavItem = {
  id: Exclude<RouteId, 'home'>
  label: string
  description: string
  pill: 'Tool' | 'Game'
}

const NAV: NavItem[] = [
  { id: 'calculator', label: 'Calculator', description: 'Fast, keyboard-friendly calculator', pill: 'Tool' },
  { id: 'stopwatch', label: 'Stopwatch', description: 'Laps, split times, smooth controls', pill: 'Tool' },
  { id: 'timer', label: 'Timer', description: 'Countdown with quick presets + sound', pill: 'Tool' },
  { id: 'sudoku', label: 'Sudoku', description: 'Notes, hints, and conflict highlighting', pill: 'Game' },
  { id: 'tictactoe', label: 'Tic‑Tac‑Toe', description: 'Play vs CPU (smart AI)', pill: 'Game' },
]

function normalizeHashRoute(hash: string): RouteId {
  const h = hash.replace('#', '').trim().toLowerCase()
  const asId = (h || 'home') as RouteId
  const allowed = new Set<RouteId>(['home', ...NAV.map((n) => n.id)])
  return allowed.has(asId) ? asId : 'home'
}

function setHash(route: RouteId) {
  window.location.hash = route === 'home' ? '' : `#${route}`
}

export function App() {
  const [route, setRoute] = useState<RouteId>(() => normalizeHashRoute(window.location.hash))

  useEffect(() => {
    const onHash = () => setRoute(normalizeHashRoute(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const current = useMemo(() => NAV.find((n) => n.id === route), [route])

  return (
    <div className="min-h-full bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(217,70,239,0.25),transparent_60%),radial-gradient(1000px_600px_at_90%_10%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_500px_at_40%_110%,rgba(34,197,94,0.12),transparent_55%)]">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-8">
        <Header onGoHome={() => setHash('home')} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="gt-card p-4 lg:sticky lg:top-8 lg:self-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-100">Toolbox</div>
                <div className="text-xs text-zinc-400">Tools + mini games</div>
              </div>
              <button className="gt-btn" onClick={() => setHash('home')} type="button">
                Home
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {NAV.map((item) => {
                const active = route === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHash(item.id)}
                    className={[
                      'w-full rounded-2xl border px-3 py-3 text-left transition',
                      active
                        ? 'border-fuchsia-400/30 bg-fuchsia-500/10'
                        : 'border-white/10 bg-white/0 hover:bg-white/5',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{item.label}</div>
                        <div className="mt-0.5 text-xs text-zinc-400">{item.description}</div>
                      </div>
                      <span
                        className={[
                          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          item.pill === 'Tool'
                            ? 'border-sky-400/20 bg-sky-500/10 text-sky-200'
                            : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                        ].join(' ')}
                      >
                        {item.pill}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-semibold text-zinc-200">Tip</div>
              <div className="mt-1 text-xs text-zinc-400">
                Most tools support keyboard input. Try pressing <kbd className="rounded bg-white/10 px-1">Esc</kbd>{' '}
                to clear in the calculator.
              </div>
            </div>
          </aside>

          <main className="gt-card min-h-[640px] p-5 sm:p-6">
            {route === 'home' ? (
              <Home onOpen={(id) => setHash(id)} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-zinc-400">{current?.pill}</div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100">{current?.label}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{current?.description}</p>
                </div>
              </div>
            )}

            {route !== 'home' && <div className="mt-6 h-px w-full bg-white/10" />}

            <div className={route === 'home' ? 'mt-6' : 'mt-6'}>
              {route === 'calculator' && <CalculatorView />}
              {route === 'stopwatch' && <StopwatchView />}
              {route === 'timer' && <TimerView />}
              {route === 'sudoku' && <SudokuView />}
              {route === 'tictactoe' && <TicTacToeView />}
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </div>
  )
}

function Header({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          React + Tailwind
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
          Gaming Toolbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          A sleek little hub for everyday tools and quick games. Everything runs locally in your browser with smooth,
          responsive interactions.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="gt-btn gt-btn-primary" onClick={onGoHome}>
          Open toolbox
        </button>
      </div>
    </div>
  )
}

function Home({ onOpen }: { onOpen: (id: Exclude<RouteId, 'home'>) => void }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item.id)}
            className="group gt-card w-full p-5 text-left transition hover:bg-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-400">{item.pill}</div>
                <div className="mt-1 text-lg font-semibold text-zinc-100">{item.label}</div>
                <div className="mt-1 text-sm text-zinc-400">{item.description}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 transition group-hover:bg-white/10">
                Open
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-zinc-100">What’s inside</div>
        <ul className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-400 sm:grid-cols-2">
          <li>
            <span className="text-zinc-200">Calculator</span> with keyboard + history
          </li>
          <li>
            <span className="text-zinc-200">Stopwatch</span> with laps
          </li>
          <li>
            <span className="text-zinc-200">Timer</span> with presets + alert
          </li>
          <li>
            <span className="text-zinc-200">Sudoku</span> with notes + conflict highlighting
          </li>
          <li className="sm:col-span-2">
            <span className="text-zinc-200">Tic‑Tac‑Toe</span> vs CPU (AI)
          </li>
        </ul>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
      <div>Gaming Toolbox • Built with React + Tailwind</div>
      <div className="text-zinc-500">Tip: Pin this tab and use it like a mini desktop app.</div>
    </div>
  )
}

