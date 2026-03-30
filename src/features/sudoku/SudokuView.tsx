import { useMemo, useState } from 'react'

type Puzzle = {
  id: string
  name: string
  givens: string // 81 chars, '0' for empty
  solution: string // 81 chars
}

const PUZZLES: Puzzle[] = [
  {
    id: 'easy-1',
    name: 'Easy',
    givens:
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution:
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  },
  {
    id: 'medium-1',
    name: 'Medium',
    givens:
      '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
    solution:
      '245986371169273584837541269976125438513894726482736915391657842728349156654812793',
  },
]

function idx(r: number, c: number) {
  return r * 9 + c
}

function inRange1to9(n: number) {
  return n >= 1 && n <= 9
}

function parseGrid(s: string): number[] {
  if (s.length !== 81) throw new Error('Invalid grid')
  return s.split('').map((ch) => Number(ch))
}

function sameBox(aR: number, aC: number, bR: number, bC: number) {
  return Math.floor(aR / 3) === Math.floor(bR / 3) && Math.floor(aC / 3) === Math.floor(bC / 3)
}

function conflictsForCell(values: number[], r: number, c: number): boolean {
  const v = values[idx(r, c)]
  if (!inRange1to9(v)) return false
  for (let i = 0; i < 9; i++) {
    if (i !== c && values[idx(r, i)] === v) return true
    if (i !== r && values[idx(i, c)] === v) return true
  }
  for (let rr = 0; rr < 9; rr++) {
    for (let cc = 0; cc < 9; cc++) {
      if (rr === r && cc === c) continue
      if (!sameBox(r, c, rr, cc)) continue
      if (values[idx(rr, cc)] === v) return true
    }
  }
  return false
}

function isSolved(values: number[], solution: number[]) {
  for (let i = 0; i < 81; i++) {
    if (values[i] !== solution[i]) return false
  }
  return true
}

type Notes = Array<Set<number>>

function emptyNotes(): Notes {
  return Array.from({ length: 81 }, () => new Set<number>())
}

export function SudokuView() {
  const [puzzleId, setPuzzleId] = useState(PUZZLES[0]!.id)
  const puzzle = useMemo(() => PUZZLES.find((p) => p.id === puzzleId) ?? PUZZLES[0]!, [puzzleId])

  const given = useMemo(() => parseGrid(puzzle.givens), [puzzle.givens])
  const solution = useMemo(() => parseGrid(puzzle.solution), [puzzle.solution])

  const [values, setValues] = useState<number[]>(() => parseGrid(puzzle.givens))
  const [notes, setNotes] = useState<Notes>(() => emptyNotes())
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null)
  const [noteMode, setNoteMode] = useState(false)
  const [showMistakes, setShowMistakes] = useState(true)

  const solved = useMemo(() => isSolved(values, solution), [values, solution])

  function loadPuzzle(id: string) {
    const p = PUZZLES.find((x) => x.id === id) ?? PUZZLES[0]!
    setPuzzleId(p.id)
    setValues(parseGrid(p.givens))
    setNotes(emptyNotes())
    setSelected(null)
  }

  function canEdit(r: number, c: number) {
    return given[idx(r, c)] === 0
  }

  function setCell(r: number, c: number, n: number | 0) {
    if (!canEdit(r, c)) return
    setValues((v) => {
      const next = v.slice()
      next[idx(r, c)] = n
      return next
    })
    setNotes((ns) => {
      const next = ns.slice()
      next[idx(r, c)] = new Set<number>()
      return next
    })
  }

  function toggleNote(r: number, c: number, n: number) {
    if (!canEdit(r, c)) return
    setNotes((ns) => {
      const next = ns.slice()
      const s = new Set(next[idx(r, c)])
      if (s.has(n)) s.delete(n)
      else s.add(n)
      next[idx(r, c)] = s
      return next
    })
  }

  function clearCell() {
    if (!selected) return
    setCell(selected.r, selected.c, 0)
  }

  function handleDigit(n: number) {
    if (!selected) return
    if (noteMode) toggleNote(selected.r, selected.c, n)
    else setCell(selected.r, selected.c, n)
  }

  function hint() {
    // fill one empty editable cell with correct value
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9)
      const c = i % 9
      if (!canEdit(r, c)) continue
      if (values[i] === 0) {
        setCell(r, c, solution[i] as number)
        setSelected({ r, c })
        return
      }
    }
  }

  function reset() {
    setValues(parseGrid(puzzle.givens))
    setNotes(emptyNotes())
    setSelected(null)
  }

  const selIdx = selected ? idx(selected.r, selected.c) : null
  const selVal = selIdx != null ? values[selIdx] : 0

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              className="gt-input w-auto"
              value={puzzleId}
              onChange={(e) => loadPuzzle(e.target.value)}
            >
              {PUZZLES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button type="button" className="gt-btn" onClick={reset}>
              Reset
            </button>
            <button type="button" className="gt-btn gt-btn-primary" onClick={hint}>
              Hint
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-fuchsia-400"
                checked={noteMode}
                onChange={(e) => setNoteMode(e.target.checked)}
              />
              Notes
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-fuchsia-400"
                checked={showMistakes}
                onChange={(e) => setShowMistakes(e.target.checked)}
              />
              Mistakes
            </label>
          </div>
        </div>

        <div
          className={[
            'mt-4 overflow-hidden rounded-3xl border bg-black/30',
            solved ? 'border-emerald-400/25 ring-2 ring-emerald-400/20' : 'border-white/10',
          ].join(' ')}
        >
          <div className="grid grid-cols-9">
            {Array.from({ length: 81 }).map((_, i) => {
              const r = Math.floor(i / 9)
              const c = i % 9
              const v = values[i]!
              const givenCell = given[i]! !== 0
              const selectedCell = selIdx === i
              const related =
                selected != null && (selected.r === r || selected.c === c || sameBox(selected.r, selected.c, r, c))
              const conflict = showMistakes ? conflictsForCell(values, r, c) : false

              const thickR = r === 2 || r === 5
              const thickC = c === 2 || c === 5

              const noteSet = notes[i]!
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected({ r, c })}
                  className={[
                    'relative aspect-square border border-white/10 p-0 text-center transition',
                    thickR ? 'border-b-white/25' : '',
                    thickC ? 'border-r-white/25' : '',
                    selectedCell ? 'bg-fuchsia-500/20' : related ? 'bg-white/5' : 'bg-transparent hover:bg-white/5',
                    conflict ? 'ring-2 ring-rose-400/30' : '',
                  ].join(' ')}
                  aria-label={`Row ${r + 1} column ${c + 1}`}
                >
                  {v !== 0 ? (
                    <span className={givenCell ? 'text-lg font-semibold text-zinc-100' : 'text-lg text-zinc-100'}>
                      {v}
                    </span>
                  ) : noteSet.size > 0 ? (
                    <div className="grid h-full w-full grid-cols-3 gap-0 p-1 text-[10px] text-zinc-400">
                      {Array.from({ length: 9 }).map((__, j) => {
                        const n = j + 1
                        return (
                          <div key={n} className="flex items-center justify-center">
                            {noteSet.has(n) ? n : ''}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-9 gap-2">
          {Array.from({ length: 9 }).map((_, i) => {
            const n = i + 1
            const active = selVal === n && !noteMode
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleDigit(n)}
                className={[
                  'rounded-2xl border px-0 py-3 text-sm font-semibold transition',
                  active ? 'border-fuchsia-400/30 bg-fuchsia-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10',
                ].join(' ')}
              >
                {n}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="gt-btn" onClick={clearCell} disabled={!selected}>
            Clear cell
          </button>
          <div className="text-xs text-zinc-500">
            {selected ? `Selected: R${selected.r + 1} C${selected.c + 1}` : 'Select a cell to start.'}
          </div>
        </div>
      </div>

      <div className="gt-card p-5 sm:p-6">
        <div className="text-sm font-semibold text-zinc-100">Status</div>
        <div className="mt-2 space-y-3 text-sm text-zinc-400">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-zinc-300">Mode</div>
            <div className="mt-1">{noteMode ? 'Notes (pencil marks)' : 'Number entry'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-zinc-300">Completion</div>
            <div className="mt-1">
              {solved ? <span className="font-semibold text-emerald-200">Solved</span> : 'Keep going'}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-zinc-300">Controls</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Toggle Notes to place small candidates.</li>
              <li>Mistakes highlights conflicts in row/col/box.</li>
              <li>Hint fills one empty cell.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

