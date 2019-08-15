import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Fab } from '@material-ui/core';
// import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
// import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}));

export default function RemoteControl(props) {
  const classes = useStyles();
  return (
    <Box my={4} display="flex" flexDirection="column" alignItems="center">
      <Fab aria-label="add" className={classes.margin} onClick={() => {props.temperature < 31 ? props.setTemperature(props.temperature + 1) : console.log('Max!')}}>
        <ExpandLessIcon />
      </Fab>
      <Fab aria-label="reduce" className={classes.margin} onClick={() => {props.temperature > 16 ? props.setTemperature(props.temperature - 1) : console.log('Min!') }}>
        <ExpandMoreIcon />
      </Fab>
    </Box>
  );
}