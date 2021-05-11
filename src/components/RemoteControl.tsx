import {
  createTheme,
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
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  decreaseTemperature,
  increaseTemperature,
  setMode,
  toggleStatus,
} from "../features/ac/acSlice";
import { RootState } from "../app/store";
import { getAssetsUrl } from "../assets/utils";

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
        playDi();
        props.onClick();
      }}
    ></Fab>
  );
}

/**
 * 播放「嘀」的音效
 */
function playDi() {
  const di = document.getElementById("di");
  if (di) {
    (di as HTMLAudioElement).play();
  }
}

let timeoutId: any;
let intervalId: any;

/**
 * 播放空调启动声音
 */
function playStartSound() {
  const acStart = document.getElementById("ac-work") as HTMLAudioElement;
  acStart.load();
  acStart.play();

  setTimeout(() => {
    playWorkSound();
  }, 8000);
}

// 噪音起始时间
const noiseStartTime = 2;
// 噪音持续时间
const noiseDuration = 56;

/**
 * 播放空调工作声音
 */
function playWorkSound() {
  const acWork = document.getElementById(
    "air-extractor-fan"
  ) as HTMLAudioElement;
  acWork.load();
  acWork.play();

  timeoutId = setTimeout(() => {
    intervalId = setInterval(() => {
      acWork.currentTime = noiseStartTime;
    }, noiseDuration * 1000);
  }, noiseStartTime * 1000);
}

/**
 * 切换空调工作状态
 * @param {*} props
 */
function toggleAC(status: boolean, dispatch: any) {
  if (status) {
    (document.getElementById("ac-work") as HTMLAudioElement).load();
    const acWork = document.getElementById(
      "air-extractor-fan"
    ) as HTMLAudioElement;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
    acWork.currentTime = noiseStartTime + noiseDuration;
  } else {
    playStartSound();
  }

  dispatch(toggleStatus());
}

const customTheme = createTheme({
  palette: {
    primary: green,
  },
});

const SOUND_DI_PATH = getAssetsUrl("/assets/audio/di.mp3");
const SOUND_AC_WORK_PATH = getAssetsUrl("/assets/audio/ac-work.mp3");
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  "/assets/audio/air-extractor-fan.mp3"
);

/**
 * 遥控
 * @param {*} props
 */
export default function RemoteControl() {
  const classes = useStyles();
  const ac = useAppSelector((state: RootState) => state.ac);
  const dispatch = useAppDispatch();
  return (
    <Box my={4} display="flex" flexDirection="column" alignItems="center">
      <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio>
      <audio id="ac-work" src={SOUND_AC_WORK_PATH} preload="auto"></audio>
      <audio
        id="air-extractor-fan"
        src={SOUND_AIR_EXTRACTOR_FAN_PATH}
        preload="auto"
      ></audio>
      <div>
        {" "}
        <RCButton
          color="primary"
          aria-label="cold"
          className={classes.margin}
          onClick={() => {
            dispatch(setMode("cold"));
          }}
        >
          <AcUnitIcon />
        </RCButton>
        <ThemeProvider theme={customTheme}>
          <RCButton
            color={ac.status ? "secondary" : "primary"}
            aria-label="add"
            className={classes.margin}
            onClick={() => {
              toggleAC(ac.status, dispatch);
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
            dispatch(setMode("hot"));
          }}
        >
          <WbSunnyIcon />
        </RCButton>
      </div>
      <RCButton
        aria-label="add"
        className={classes.margin}
        onClick={() => {
          dispatch(increaseTemperature());
        }}
      >
        <ExpandLessIcon />
      </RCButton>
      <RCButton
        aria-label="reduce"
        className={classes.margin}
        onClick={() => {
          dispatch(decreaseTemperature());
        }}
      >
        <ExpandMoreIcon />
      </RCButton>
    </Box>
  );
}
