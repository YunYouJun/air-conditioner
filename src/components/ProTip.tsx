import React from "react";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import EmojiObjectsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import { jumpToAdsense, adsenseLink } from "../features/adsense";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

/**
 * 喜马拉雅链接
 * @param props
 * @returns
 */
const AdsenseLink: React.FC<{ text: string }> = (props) => {
  return (
    <a
      className="adsense-text-link"
      href={adsenseLink}
      target="_blank"
      onClick={() => {
        jumpToAdsense();
      }}
    >
      {props.text || "喜马拉雅"}
    </a>
  );
};

export default function ProTip() {
  const classes = useStyles();
  return (
    <Typography align="center" className={classes.root} color="textSecondary">
      <EmojiObjectsOutlinedIcon />
      Tip: 为你的夏日带去
      {import.meta.env.VITE_DISABLE_ADSENSE ? (
        "清凉"
      ) : (
        <AdsenseLink text="清凉" />
      )}
      ！
    </Typography>
  );
}
