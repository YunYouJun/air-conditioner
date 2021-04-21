import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";

import "./App.scss";
import ProTip from "./components/Protip";
import RemoteControl from "./components/RemoteControl";

import AirConditioner from "./features/ac/AirConditioner";
import Toast from "./features/toast/Toast";

import { ThemeProvider } from "./theme";

import * as pkg from "../package.json";
import { useAppSelector } from "./app/hooks";
import { RootState } from "./app/store";

function Copyright() {
  return (
    <div>
      <Box>
        <Typography variant="body2" color="textSecondary" align="center">
          {"© "}
          <Link color="inherit" href={pkg.repository.url}>
            Yun Air Conditioner
          </Link>
          {" - "}
          <Link color="inherit" href={pkg.author.url}>
            {pkg.author.name}
          </Link>
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" align="center">
        {" 2019 - " + new Date().getFullYear()}
      </Typography>
    </div>
  );
}

function App() {
  const ac = useAppSelector((state: RootState) => state.ac);

  return (
    <ThemeProvider>
      <Container maxWidth="sm">
        <Box sx={{ pt: 4 }} bgcolor="transparent">
          <Typography
            color="textPrimary"
            align="center"
            variant="h4"
            component="h1"
            gutterBottom
          >
            便携小空调
          </Typography>
          <ProTip />
          <AirConditioner
            status={ac.status}
            temperature={ac.temperature}
            mode={ac.mode}
          />
          <RemoteControl />
          <Copyright />
        </Box>
        <Toast />
      </Container>
    </ThemeProvider>
  );
}

export default App;
