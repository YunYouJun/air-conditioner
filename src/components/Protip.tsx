import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import EmojiObjectsOutlinedIcon from "@material-ui/icons/EmojiObjectsOutlined";

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
      Tip: 为你的夏日带去清凉！
    </Typography>
  );
}
