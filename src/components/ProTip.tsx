import { makeStyles } from "@material-ui/styles";
import Typography from "@material-ui/core/Typography";
import EmojiObjectsOutlinedIcon from "@material-ui/icons/EmojiObjectsOutlined";
import { jumpToXimalaya, ximalayaLink } from "../features/adsense";
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
function XimalayaLink(props: { text: string }) {
  return (
    <a
      className="ximalaya-text-link"
      href={ximalayaLink}
      target="_blank"
      onClick={() => {
        jumpToXimalaya();
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
        <XimalayaLink text="清凉" />
      )}
      ！
    </Typography>
  );
}
