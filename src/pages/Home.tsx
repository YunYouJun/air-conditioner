import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import ProTip from "../components/ProTip";
import RemoteControl from "../components/RemoteControl";

import AirConditioner from "../features/ac/AirConditioner";
import Toast from "../features/toast/Toast";

import { ThemeProvider } from "../theme";

import { useAppSelector } from "../app/hooks";
import { RootState } from "../app/store";
import Copyright from "../layouts/Copyright";
import { useDetectStorage } from "../features/ac";

function Home() {
  const ac = useAppSelector((state: RootState) => state.ac);

  useDetectStorage();

  /**
   * 根据模式返回对应的色温
   * @returns
   */
  function getClassByMode() {
    if (ac.status) {
      return ac.mode === "hot" ? "hot-color" : "cold-color";
    } else {
      return "";
    }
  }

  return (
    <ThemeProvider>
      <Container maxWidth="sm" className={getClassByMode()}>
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
          <div className="text-center">
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  window.open("/#/rc", "_blank", "width=300, height=400");
                }}
              >
                独立遥控器
              </Button>
            </Box>
          </div>
          <RemoteControl />
          <Copyright />
        </Box>
        <Toast />
      </Container>
    </ThemeProvider>
  );
}

export default Home;
