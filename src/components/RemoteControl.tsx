import {
  createMuiTheme,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core/styles";
import { Box, Fab } from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import WbSunnyIcon from "@material-ui/icons/WbSunny";

import { green } from "@material-ui/core/colors";

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}));

/**
 * 遥控器按钮
 * @param props
 */
function RCButton(props: any) {
  return (
    <Fab
      {...props}
      onClick={() => {
        playDi(props);
        props.onClick();
      }}
    ></Fab>
  );
}

/**
 * 播放「嘀」的音效
 */
function playDi(props: any) {
  const di = document.getElementById("di");
  if (di) {
    (di as HTMLAudioElement).play();
  }
}

/**
 * 播放工作声音
 */
function playWorkSound() {
  const acWork = document.getElementById("ac-work") as HTMLAudioElement;
  acWork.load();
  acWork.play();
}

/**
 * 增加温度
 * @param {*} props
 */
function increaseTemperature(props: any) {
  props.temperature < 31
    ? props.setTemperature(props.temperature + 1)
    : console.log("已经是最大温度啦！");
}

/**
 * 降低温度
 * @param {*} props
 */
function decreaseTemperature(props: any) {
  props.temperature > 16
    ? props.setTemperature(props.temperature - 1)
    : console.log("已经是最小温度啦！");
}

/**
 * 切换空调工作状态
 * @param {*} props
 */
function toggleAC(props: any) {
  if (props.status) {
    (document.getElementById("ac-work") as HTMLAudioElement).load();
  } else {
    playWorkSound();
  }
  props.setStatus(!props.status);
}

type AcMode = "cold" | "hot";

/**
 * 切换模式 cold | hot
 * @param {*} mode
 */
function toggleMode(props: any, mode: AcMode) {
  props.setMode(mode);
}

const theme = createMuiTheme({
  palette: {
    primary: green,
  },
});

const SOUND_DI_PATH = "/assets/audio/di.mp3";
const SOUND_AC_WORK_PATH = "/assets/audio/ac-work.mp3";

/**
 * 遥控
 * @param {*} props
 */
export default function RemoteControl(props: any) {
  const classes = useStyles();
  return (
    <Box my={4} display="flex" flexDirection="column" alignItems="center">
      <audio
        id="di"
        src={process.env.PUBLIC_URL + SOUND_DI_PATH}
        preload="auto"
      ></audio>
      <audio
        id="ac-work"
        src={process.env.PUBLIC_URL + SOUND_AC_WORK_PATH}
        preload="auto"
      ></audio>
      <div>
        {" "}
        <RCButton
          color="primary"
          aria-label="cold"
          className={classes.margin}
          onClick={() => {
            toggleMode(props, "cold");
          }}
        >
          <AcUnitIcon />
        </RCButton>
        <ThemeProvider theme={theme}>
          <RCButton
            color={props.status ? "secondary" : "primary"}
            aria-label="add"
            className={classes.margin}
            onClick={() => {
              toggleAC(props);
            }}
            style={{ color: "white" }}
          >
            <PowerSettingsNewIcon />
          </RCButton>
        </ThemeProvider>
        <RCButton
          aria-label="hot"
          className={classes.margin}
          style={{ backgroundColor: "orange", color: "white" }}
          onClick={() => {
            toggleMode(props, "hot");
          }}
        >
          <WbSunnyIcon />
        </RCButton>
      </div>
      <RCButton
        aria-label="add"
        className={classes.margin}
        onClick={() => {
          increaseTemperature(props);
        }}
      >
        <ExpandLessIcon />
      </RCButton>
      <RCButton
        aria-label="reduce"
        className={classes.margin}
        onClick={() => {
          decreaseTemperature(props);
        }}
      >
        <ExpandMoreIcon />
      </RCButton>
    </Box>
  );
}
