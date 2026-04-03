import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'gaming-toolbox-theme'

export type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'light' || s === 'dark') return s
  } catch {
    // ignore
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Light</span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={toggleTheme}
        className="relative h-7 w-12 shrink-0 rounded-full border border-zinc-300/90 bg-zinc-200/90 transition dark:border-white/15 dark:bg-zinc-700/90"
      >
        <span
          className={[
            'pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-zinc-400/20 transition-transform dark:ring-white/10',
            isDark ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Dark</span>
    </div>
  )
}
