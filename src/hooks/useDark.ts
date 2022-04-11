import { useEffect } from 'react'
import { useDarkMode } from 'usehooks-ts'

// https://stackoverflow.com/questions/70996320/enable-hot-reload-for-vite-react-project-instead-of-page-reload
// avoid reload page
export default function useDark() {
  const { isDarkMode: isDark, toggle: toggleDark } = useDarkMode()

  useEffect(() => {
    if (isDark)
      document.documentElement.classList.add('dark')
    else
      document.documentElement.classList.remove('dark')
  }, [isDark])

  return {
    isDark,
    toggleDark,
  }
}
