import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import EmojiObjectsOutlinedIcon from "@material-ui/icons/EmojiObjectsOutlined";
import { ximalayaLink } from "../features/adsense";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(3, 0),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

export default function ProTip() {
  const classes = useStyles();
  return (
    <Typography align="center" className={classes.root} color="textSecondary">
      <EmojiObjectsOutlinedIcon />
      Tip: {/* eslint-disable-next-line */}
      <a className="ximalaya-text-link" href={ximalayaLink} target="_blank">
        喜马拉雅
      </a>
      为你的夏日带去清凉！
    </Typography>
  );
}
