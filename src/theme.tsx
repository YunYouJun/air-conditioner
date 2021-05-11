import { useMemo } from "react";
import PropTypes from "prop-types";
import { useMediaQuery } from "@material-ui/core";
import { ThemeProvider as MuiThemeProvider } from "@material-ui/styles";
import { createTheme } from "@material-ui/core/styles";

export function ThemeProvider(props: any) {
  const { children } = props;

  // https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media/prefers-color-scheme
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredMode = prefersDarkMode ? "dark" : "light";
  // A custom theme for this app
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: preferredMode,
        },
      }),
    [preferredMode]
  );

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export default ThemeProvider;
