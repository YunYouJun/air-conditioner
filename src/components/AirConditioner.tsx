import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography, Fade } from "@material-ui/core";
import logo from "../logo.svg";

const acColor = {
  border: "#e0e0e0",
  display: "#cccccc",
  wind: "#bbbbbb",
};

const useStyles = makeStyles((theme) => ({
  acBorder: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  acDisplay: {
    textShadow: "0px 0px 2px rgba(0, 0, 0, 0.3)",
    // visibility: (props) => props.visibility,
  },
  acLogo: {
    width: 12,
  },
  acStatus: {
    // backgroundColor: (props) => props.backgroundColor,
  },
  energyLabel: {
    backgroundColor: "#4ea5f5",
  },
}));

function AcBorder(props: any) {
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
    ></Box>
  );
}

/**
 * 显示屏（温度/图标）
 * @param props
 */
function AcDisplay(props: any) {
  return (
    <Box
      {...props}
      position="absolute"
      top={25}
      right={30}
      color={acColor.display}
    >
      <Typography align="left" variant="subtitle2">
        <span>{props.mode === "cold" ? "❄" : "☀️"}</span>️️
      </Typography>
      <Typography variant="h4" align="center">
        {props.temperature}
        <small>°C</small>
      </Typography>
    </Box>
  );
}

/**
 * 空调 Logo
 * @param props
 */
function AcLogo(props: any) {
  return (
    // <Box align="center" mt={12}>
    <Box textAlign="center" mt={12}>
      <img className={props.className} src={logo} alt="logo" />
    </Box>
  );
}

function AirOutlet() {
  return <Box mt={1} border={1} borderColor={acColor.border}></Box>;
}

/**
 * 空调状态
 * @param props
 */
function AcStatus(props: any) {
  const led = { backgroundColor: props.status ? "#38F709" : acColor.border };
  const classes = useStyles(led);
  return (
    <Box
      className={classes.acStatus}
      position="absolute"
      height={4}
      width={4}
      borderRadius="50%"
      top={130}
      right={10}
    ></Box>
  );
}

/**
 * 文本标签（黑色小点点）
 * @param num
 * @param color
 * @param size
 * @param mx
 * @param my
 */
function textLabel(
  num: number,
  color: string,
  size: number,
  mx: number,
  my = 0
) {
  const titleLength = [...new Array(num).keys()];
  const titleLabel = titleLength.map((n) => (
    <Box
      key={n}
      mx={mx}
      my={my}
      width={size}
      height={size}
      borderRadius="50%"
      bgcolor={color}
    ></Box>
  ));
  return (
    <Box display="flex" justifyContent="center">
      {titleLabel}
    </Box>
  );
}

/**
 * 功耗标签
 * @param props
 */
function EnergyLabel(props: any) {
  return (
    <Box
      className={props.className}
      position="absolute"
      top={10}
      left={10}
      height={70}
      width={50}
      borderRadius={2}
      p={0.5}
    >
      {textLabel(6, "white", 4, 0.25)}
      <Box
        my={0.5}
        px={1}
        py={0.25}
        height={28}
        width="100%"
        bgcolor="background.paper"
      >
        <Box bgcolor="green" height={3} width="40%"></Box>
        <Box mt={0.25} bgcolor="lightGreen" height={3} width="50%"></Box>
        <Box mt={0.25} bgcolor="#ffc107" height={3} width="60%"></Box>
        <Box mt={0.25} bgcolor="orange" height={3} width="70%"></Box>
        <Box mt={0.25} bgcolor="red" height={3} width="80%"></Box>
      </Box>
      <Box
        mb={0.25}
        pt={0.1}
        height={20}
        width="100%"
        bgcolor="background.paper"
      >
        {textLabel(11, "black", 2, 0.1, 0.25)}
        <Box my={0.1} borderTop={1} height={0} width="100%"></Box>
        {textLabel(9, "black", 1.5, 0.1, 0.25)}
        {textLabel(10, "black", 1.2, 0.1, 0)}
      </Box>
      {textLabel(8, "white", 2, 0.1)}
    </Box>
  );
}

/**
 * 风特效
 * @param props
 */
function WindEffect(props: any) {
  return (
    <Box {...props} mt={3} display="flex" justifyContent="center">
      <Box
        style={{ transform: "rotate(10deg)" }}
        bgcolor={acColor.wind}
        width={5}
        height={40}
      ></Box>
      <Box mx={10} bgcolor={acColor.wind} width={5} height={40}></Box>
      <Box
        style={{ transform: "rotate(-10deg)" }}
        bgcolor={acColor.wind}
        width={5}
        height={40}
      ></Box>
    </Box>
  );
}

/**
 * 空调
 * @param props
 */
export default function AirConditioner(props: any) {
  const classes = useStyles();
  return (
    <Box>
      <AcBorder className={classes.acBorder}>
        <Fade in={props.status}>
          <AcDisplay mode={props.mode} temperature={props.temperature} />
        </Fade>
        <AcLogo className={classes.acLogo} />
        <AirOutlet />
        <AcStatus status={props.status} />
        <EnergyLabel className={classes.energyLabel} titleLength={6} />
      </AcBorder>
      <Fade in={props.status} timeout={{ enter: 2500, exit: 1500 }}>
        <WindEffect />
      </Fade>
    </Box>
  );
}
