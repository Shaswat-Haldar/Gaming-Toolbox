import { useEffect, useMemo, useState } from 'react'

type Mark = 'X' | 'O'
type Cell = Mark | null

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function winner(board: Cell[]): { win: Mark; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) return { win: v, line }
  }
  return null
}

function isFull(board: Cell[]) {
  return board.every((c) => c != null)
}

function other(m: Mark): Mark {
  return m === 'X' ? 'O' : 'X'
}

function availableMoves(board: Cell[]) {
  const out: number[] = []
  for (let i = 0; i < 9; i++) if (board[i] == null) out.push(i)
  return out
}

function minimax(board: Cell[], current: Mark, ai: Mark, depth: number): { score: number; move: number | null } {
  const w = winner(board)
  if (w) return { score: w.win === ai ? 10 - depth : depth - 10, move: null }
  if (isFull(board)) return { score: 0, move: null }

  const moves = availableMoves(board)
  let bestMove: number | null = null

  if (current === ai) {
    let bestScore = -Infinity
    for (const mv of moves) {
      const next = board.slice()
      next[mv] = current
      const r = minimax(next, other(current), ai, depth + 1)
      if (r.score > bestScore) {
        bestScore = r.score
        bestMove = mv
      }
    }
    return { score: bestScore, move: bestMove }
  }

  let bestScore = Infinity
  for (const mv of moves) {
    const next = board.slice()
    next[mv] = current
    const r = minimax(next, other(current), ai, depth + 1)
    if (r.score < bestScore) {
      bestScore = r.score
      bestMove = mv
    }
  }
  return { score: bestScore, move: bestMove }
}

export function TicTacToeView() {
  const [mode, setMode] = useState<'CPU' | '2P'>('CPU')
  const [player, setPlayer] = useState<Mark>('X')
  const [board, setBoard] = useState<Cell[]>(Array.from({ length: 9 }, () => null))
  const [turn, setTurn] = useState<Mark>('X')
  const [locked, setLocked] = useState(false)
  const [difficulty, setDifficulty] = useState<'Smart' | 'Chill'>('Smart')

  const cpu = useMemo(() => other(player), [player])
  const w = useMemo(() => winner(board), [board])
  const draw = useMemo(() => !w && isFull(board), [w, board])

  useEffect(() => {
    if (mode !== 'CPU') return
    if (w || draw) return
    if (turn !== cpu) return
    setLocked(true)

    const t = window.setTimeout(() => {
      const moves = availableMoves(board)
      if (moves.length === 0) return
      let mv: number

      if (difficulty === 'Chill' && Math.random() < 0.45) {
        mv = moves[Math.floor(Math.random() * moves.length)]!
      } else {
        mv = minimax(board, cpu, cpu, 0).move ?? moves[0]!
      }

      setBoard((b) => {
        const next = b.slice()
        next[mv] = cpu
        return next
      })
      setTurn(player)
      setLocked(false)
    }, 260)

    return () => window.clearTimeout(t)
  }, [turn, cpu, player, board, w, draw, difficulty, mode])

  function reset(nextPlayer?: Mark) {
    const p = nextPlayer ?? player
    setPlayer(p)
    setBoard(Array.from({ length: 9 }, () => null))
    setTurn('X')
    setLocked(false)
  }

  function clickCell(i: number) {
    if (locked) return
    if (w || draw) return
    if (board[i] != null) return
    if (mode === 'CPU') {
      if (turn !== player) return
      setBoard((b) => {
        const next = b.slice()
        next[i] = player
        return next
      })
      setTurn(cpu)
      return
    }

    // 2-player local mode: alternate marks each turn
    setBoard((b) => {
      const next = b.slice()
      next[i] = turn
      return next
    })
    setTurn((t) => other(t))
  }

  const status =
    mode === 'CPU'
      ? w
        ? w.win === player
          ? 'You win.'
          : 'CPU wins.'
        : draw
          ? 'Draw.'
          : turn === player
            ? 'Your turn.'
            : 'CPU thinking…'
      : w
        ? `${w.win} wins.`
        : draw
          ? 'Draw.'
          : `Turn: ${turn}`

  function changeMode(next: 'CPU' | '2P') {
    setMode(next)
    // Always reset the board when switching modes
    setBoard(Array.from({ length: 9 }, () => null))
    setTurn('X')
    setLocked(false)
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{status}</div>
          <div className="flex items-center gap-2">
            <button className="gt-btn" type="button" onClick={() => reset()}>
              New game
            </button>
            <button className="gt-btn gt-btn-primary" type="button" onClick={() => reset(other(player))}>
              Swap sides
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200/90 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-black/30">
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, i) => {
              const highlight = w?.line.includes(i) ?? false
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => clickCell(i)}
                  className={[
                    'aspect-square rounded-2xl border text-4xl font-semibold tracking-tight transition sm:text-5xl',
                    'border-zinc-200/90 bg-zinc-100/80 hover:bg-zinc-200/70 active:scale-[0.99] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                    highlight ? 'border-emerald-500/35 bg-emerald-500/10 dark:border-emerald-400/30' : '',
                    locked || turn !== player || w || draw
                      ? 'cursor-default hover:bg-zinc-100/80 dark:hover:bg-white/5'
                      : '',
                  ].join(' ')}
                  aria-label={`Cell ${i + 1}`}
                >
                  <span className={cell === 'X' ? 'text-fuchsia-700 dark:text-fuchsia-200' : 'text-sky-700 dark:text-sky-200'}>
                    {cell ?? ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {mode === 'CPU' ? (
            <>
              <span>
                You: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{player}</span>
              </span>
              <span>•</span>
              <span>
                CPU: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cpu}</span>
              </span>
            </>
          ) : (
            <>
              <span>
                Player 1: <span className="font-semibold text-zinc-800 dark:text-zinc-200">X</span>
              </span>
              <span>•</span>
              <span>
                Player 2: <span className="font-semibold text-zinc-800 dark:text-zinc-200">O</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="gt-card p-5 sm:p-6">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mode</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['CPU', '2P'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => changeMode(m)}
              className={[
                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                mode === m
                  ? 'border-fuchsia-400/35 bg-fuchsia-500/12 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/15'
                  : 'border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
              ].join(' ')}
            >
              {m === 'CPU' ? 'Vs CPU' : '2 players'}
            </button>
          ))}
        </div>

        {mode === 'CPU' && (
          <>
            <div className="mt-6 text-sm font-semibold text-zinc-900 dark:text-zinc-100">CPU difficulty</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Choose between a perfect “Smart” CPU (unbeatable) or a more relaxed “Chill” CPU that occasionally plays a
              random move.
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(['Smart', 'Chill'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={[
                    'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    difficulty === d
                      ? 'border-fuchsia-400/35 bg-fuchsia-500/12 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/15'
                      : 'border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                  ].join(' ')}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tip</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            In 2‑player mode, share the board locally. In CPU mode, play as{' '}
            <span className="text-zinc-800 dark:text-zinc-200">X</span> to start, or swap sides anytime.
          </div>
        </div>
      </div>
    </div>
  )
}

