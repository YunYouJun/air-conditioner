import React, { useMemo } from 'react'
import {
  useMediaQuery,
  ThemeProvider as MuiThemeProvider,
  PaletteMode,
  IconButton,
  useTheme,
} from '@mui/material'
import { createTheme } from '@mui/material/styles'

import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
const ColorModeContext = React.createContext({ toggleColorMode: () => {} })

export const ToggleModeBtn: React.FC = () => {
  const theme = useTheme()

  return (
    <>
      <IconButton>
        {theme.palette.mode === 'dark'
          ? (
            <Brightness7Icon />
          )
          : (
            <Brightness4Icon />
          )}
      </IconButton>
    </>
  )
}

export const AppTheme: React.FC = (props) => {
  const [mode, setMode] = React.useState<PaletteMode>('light')
  // https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media/prefers-color-scheme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  // Remount styles after React hydration
  React.useEffect(() => {
    const preferredMode = prefersDarkMode ? 'dark' : 'light'
    setMode(preferredMode)
  }, [])

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'))
      },
    }),
    [],
  )

  // A custom theme for this app
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>{props.children}</MuiThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default AppTheme
