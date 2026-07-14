import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('echo-theme', theme)
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('echo-theme') as Theme) || 'light',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      applyTheme(next)
      return { theme: next }
    }),
}))

// Initialize on load
applyTheme(useThemeStore.getState().theme)
