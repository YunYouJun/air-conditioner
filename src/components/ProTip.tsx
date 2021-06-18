import { makeStyles } from "@material-ui/styles";
import Typography from "@material-ui/core/Typography";
import EmojiObjectsOutlinedIcon from "@material-ui/icons/EmojiObjectsOutlined";
import { jumpToAdsense, adsenseLink } from "../features/adsense";
import { Theme } from "@material-ui/core";

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
function AdsenseLink(props: { text: string }) {
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
}

export default function ProTip() {
  const classes = useStyles();
  return (
    <Typography align="center" className={classes.root} color="textSecondary">
      <EmojiObjectsOutlinedIcon />
      Tip: 为你的夏日带去
      {process.env.REACT_APP_DISABLE_ADSENSE ? (
        "清凉"
      ) : (
        <AdsenseLink text="清凉" />
      )}
      ！
    </Typography>
  );
}
