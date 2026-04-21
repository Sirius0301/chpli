import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((state) => {
          const next = !state.isDark
          document.documentElement.classList.toggle('dark', next)
          return { isDark: next }
        }),
    }),
    {
      name: 'bm-theme',
    }
  )
)
