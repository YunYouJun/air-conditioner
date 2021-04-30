import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import ProTip from "../components/Protip";
import RemoteControl from "../components/RemoteControl";

import AirConditioner from "../features/ac/AirConditioner";
import Toast from "../features/toast/Toast";

import { ThemeProvider } from "../theme";

import { useAppSelector } from "../app/hooks";
import { RootState } from "../app/store";
import Copyright from "../layouts/Copyright";

function Home() {
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

export default Home;
