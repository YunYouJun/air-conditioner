import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Fab } from '@material-ui/core';
// import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
// import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}));

function RCButton(props) {
  return (
    <Fab {...props} onClick={() => { playDi(); props.onClick(); }}></Fab>
  )
}

function playDi() {
  let di = document.getElementById('di');
  di.play();
}

function playWorkSound() {
  let acWork = document.getElementById('ac-work');
  acWork.load();
  acWork.play();
}

function increaseTemperature(props) {
  props.temperature < 31 ? props.setTemperature(props.temperature + 1) : console.log('Max!');
}

function decreaseTemperature(props) {
  props.temperature > 16 ? props.setTemperature(props.temperature - 1) : console.log('Min!');
}

function toggleAC(props) {
  if (props.status) {
    document.getElementById('ac-work').load();
  } else {
    playWorkSound();
  }
  props.setStatus(!props.status);
}

export default function RemoteControl(props) {
  const classes = useStyles();
  return (
    <Box my={4} display="flex" flexDirection="column" alignItems="center">
      <audio id="di" src="./assets/audio/di.wav" preload="auto"></audio>
      <audio id="ac-work" src="./assets/audio/ac-work.wav" preload="auto"></audio>
      <RCButton color="secondary" aria-label="add" className={classes.margin} onClick={() => { toggleAC(props) }}>
        <PowerSettingsNewIcon />
      </RCButton>
      <RCButton aria-label="add" className={classes.margin} onClick={() => { increaseTemperature(props) }}>
        <ExpandLessIcon />
      </RCButton>
      <RCButton aria-label="reduce" className={classes.margin} onClick={() => { decreaseTemperature(props) }}>
        <ExpandMoreIcon />
      </RCButton>
    </Box>
  );
}