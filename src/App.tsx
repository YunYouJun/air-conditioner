import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";

import "./App.scss";
import ProTip from "./components/Protip";
import RemoteControl from "./components/RemoteControl";

import AirConditioner from "./features/ac/AirConditioner";
import Toast from "./features/toast/Toast";

import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/styles";
import theme from "./theme";

import * as pkg from "../package.json";
import { useAppSelector } from "./app/hooks";
import { RootState } from "./app/store";

function Copyright() {
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href={pkg.repository.url}>
          Yun Air Conditioner
        </Link>
        {" - "}
        <Link color="inherit" href={pkg.author.url}>
          {pkg.author.name}
        </Link>
        {" 2019 -  "}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

function App() {
  const ac = useAppSelector((state: RootState) => state.ac);
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography align="center" variant="h4" component="h1" gutterBottom>
            便携小空调
          </Typography>
          <ProTip />
          <AirConditioner status={ac.status} temperature={ac.temperature} />
          <RemoteControl />
          <Copyright />
        </Box>
        <Toast />
      </Container>
    </ThemeProvider>
  );
}

export default App;
