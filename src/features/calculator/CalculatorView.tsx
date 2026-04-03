import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

type HistoryItem = { expr: string; result: string; at: number }

const BUTTONS: Array<{ label: string; value: string; kind?: 'op' | 'fn' | 'num' }> = [
  { label: 'C', value: 'CLEAR', kind: 'fn' },
  { label: '⌫', value: 'BACK', kind: 'fn' },
  { label: '%', value: '%', kind: 'op' },
  { label: '÷', value: '/', kind: 'op' },
  { label: '7', value: '7', kind: 'num' },
  { label: '8', value: '8', kind: 'num' },
  { label: '9', value: '9', kind: 'num' },
  { label: '×', value: '*', kind: 'op' },
  { label: '4', value: '4', kind: 'num' },
  { label: '5', value: '5', kind: 'num' },
  { label: '6', value: '6', kind: 'num' },
  { label: '−', value: '-', kind: 'op' },
  { label: '1', value: '1', kind: 'num' },
  { label: '2', value: '2', kind: 'num' },
  { label: '3', value: '3', kind: 'num' },
  { label: '+', value: '+', kind: 'op' },
  { label: '0', value: '0', kind: 'num' },
  { label: '.', value: '.', kind: 'num' },
  { label: '()', value: 'PAREN', kind: 'fn' },
  { label: '=', value: 'EVAL', kind: 'fn' },
]

function sanitizeExpression(expr: string) {
  // allow digits, operators, parentheses, decimal points, whitespace
  return expr.replace(/[^\d+\-*/().%\s]/g, '')
}

function formatNumberLike(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'Error'
    const abs = Math.abs(value)
    if (abs > 1e12 || (abs !== 0 && abs < 1e-9)) return value.toExponential(8)
    return Number(value.toFixed(10)).toString()
  }
  return String(value)
}

function tryEval(exprRaw: string): { ok: true; result: string } | { ok: false; error: string } {
  const expr = sanitizeExpression(exprRaw)
  if (!expr.trim()) return { ok: false, error: 'Empty' }

  // small guardrails against obviously broken inputs
  if (/[*+/.-]{3,}/.test(expr.replace(/\s/g, ''))) return { ok: false, error: 'Invalid' }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${expr});`)
    const out = fn()
    return { ok: true, result: formatNumberLike(out) }
  } catch {
    return { ok: false, error: 'Invalid expression' }
  }
}

export function CalculatorView() {
  const [expr, setExpr] = useState('')
  const [resultPreview, setResultPreview] = useState<string>('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const preview = useMemo(() => {
    const t = expr.trim()
    if (!t) return ''
    const r = tryEval(t)
    return r.ok ? r.result : ''
  }, [expr])

  useEffect(() => {
    setResultPreview(preview)
  }, [preview])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function push(value: string) {
    setExpr((e) => sanitizeExpression((e + value).replace(/\s+/g, ' ')))
  }

  function backspace() {
    setExpr((e) => e.slice(0, -1))
  }

  function clear() {
    setExpr('')
    setResultPreview('')
  }

  function insertParen() {
    setExpr((e) => {
      const opens = (e.match(/\(/g) || []).length
      const closes = (e.match(/\)/g) || []).length
      const last = e.trim().slice(-1)
      const shouldOpen = opens === closes || /[+\-*/(]$/.test(last) || last === ''
      return e + (shouldOpen ? '(' : ')')
    })
  }

  function evalNow() {
    const r = tryEval(expr)
    if (!r.ok) return
    const item: HistoryItem = { expr: expr.trim(), result: r.result, at: Date.now() }
    setHistory((h) => [item, ...h].slice(0, 12))
    setExpr(r.result === 'Error' ? '' : r.result)
  }

  function onButton(value: string) {
    if (value === 'CLEAR') return clear()
    if (value === 'BACK') return backspace()
    if (value === 'PAREN') return insertParen()
    if (value === 'EVAL') return evalNow()
    push(value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      evalNow()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      clear()
      return
    }
    if (e.key === 'Backspace') return
    // Allow typing, but keep it safe/sanitized in onChange
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="gt-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Calculator</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Keyboard: Enter to evaluate, Esc to clear.</div>
          </div>
          <button className="gt-btn" type="button" onClick={() => setHistory([])}>
            Clear history
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-black/30">
          <input
            ref={inputRef}
            value={expr}
            onKeyDown={onKeyDown}
            onChange={(e) => setExpr(sanitizeExpression(e.target.value))}
            className="w-full bg-transparent text-right text-2xl font-semibold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            placeholder="0"
            inputMode="decimal"
            aria-label="Calculator expression"
          />
          <div className="mt-1 text-right text-sm text-zinc-600 dark:text-zinc-400">{resultPreview ? `= ${resultPreview}` : ' '}</div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {BUTTONS.map((b) => {
            const isEval = b.value === 'EVAL'
            const isFn = b.kind === 'fn'
            return (
              <button
                key={b.label}
                type="button"
                onClick={() => onButton(b.value)}
                className={[
                  'rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition',
                  isEval
                    ? 'col-span-1 border-fuchsia-400/35 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 dark:border-fuchsia-400/25 dark:bg-fuchsia-500/20 dark:hover:bg-fuchsia-500/30'
                    : isFn
                      ? 'border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                      : 'border-zinc-200/90 bg-transparent hover:bg-zinc-100/80 dark:border-white/10 dark:bg-white/0 dark:hover:bg-white/5',
                ].join(' ')}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="gt-card p-4 sm:p-5">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">History</div>
        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Tap an item to reuse it.</div>

        <div className="mt-4 space-y-2">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              No calculations yet.
            </div>
          ) : (
            history.map((h) => (
              <button
                key={h.at}
                type="button"
                onClick={() => setExpr(h.result === 'Error' ? h.expr : h.result)}
                className="w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-3 text-left transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="text-xs text-zinc-600 dark:text-zinc-400">{h.expr}</div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{h.result}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

