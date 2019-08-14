import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography } from '@material-ui/core';
import logo from '../logo.svg';

const acColor = {
  border: "#e0e0e0",
  display: "#cccccc"
}

const useStyles = makeStyles(theme => ({
  acBorder: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  acDisplay: {
    textShadow: '0px 0px 2px rgba(0, 0, 0, 0.3)',
  },
  acLogo: {
    width: 12,
  },
  acStatus: {
    backgroundColor: props => props.backgroundColor,
  },
  energyLabel: {
    backgroundColor: '#4ea5f5',
  }
}));

function AcBorder(props) {
  return (
    <Box
      bgcolor="background.paper"
      height={150}
      border={1}
      borderColor={acColor.border}
      borderRadius={10}
      boxShadow={3}
      position="relative"
      {...props}
    >
    </Box>
  )
}

function AcDisplay(props) {
  return (
    <Box className={props.className} position="absolute" top={25} right={30} color={acColor.display}>
      <Typography align="left" variant="subtitle2">
        <span>❄</span>️
      </Typography>
      <Typography variant="h4" align="center">
        { props.temperature + '°'}
      </Typography>
    </Box>
  )
}

function AcLogo(props) {
  return (
    <Box align="center" mt={12}>
      <img className={props.className} src={logo} alt="logo" />
    </Box>
  )
}

function AirOutlet() {
  return (
    <Box mt={1} border={1} borderColor={acColor.border}>
    </Box>
  )
}

function AcStatus(props) {
  const led = { backgroundColor: props.status === 'work' ? '#38F709' : 'red' };
  const classes = useStyles(led);
  return (
    <Box
      className={classes.acStatus}
      position="absolute"
      height={5}
      width={5}
      borderRadius="50%"
      top={130}
      right={10}
    >
    </Box>
  )
}

function EnergyLabel(props) {
  return (
    <Box className={props.className} position="absolute" top={10} left={10} height={70} width={50} borderRadius={2} p={0.5}>
      <Box my={0.5} px={1} py={0.25} height={28} width="100%" bgcolor="background.paper">
        <Box bgcolor="green" height={3} width="40%"></Box>
        <Box mt={0.25} bgcolor="lightGreen" height={3} width="50%"></Box>
        <Box mt={0.25} bgcolor="yellow" height={3} width="60%"></Box>
        <Box mt={0.25} bgcolor="secondary.main" height={3} width="70%"></Box>
        <Box mt={0.25} bgcolor="error.main" height={3} width="80%"></Box>
      </Box>
      <Box height={20} width="100%" bgcolor="background.paper"></Box>
    </Box>
  )
}

export default function AirConditioner() {
  const classes = useStyles();
  return (
    <AcBorder className={classes.acBorder}>
      <AcDisplay className={classes.acDisplay} temperature="16"/>
      <AcLogo className={classes.acLogo} />
      <AirOutlet />
      <AcStatus status="work" />
      <EnergyLabel className={classes.energyLabel} />
    </AcBorder>
  );
}