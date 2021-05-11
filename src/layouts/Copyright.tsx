import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import * as pkg from "../../package.json";

function Copyright() {
  return (
    <div>
      <Box>
        <Typography variant="body2" color="textSecondary" align="center">
          {"© "}
          <Link color="inherit" href={pkg.repository.url} target="_blank">
            Yun Air Conditioner
          </Link>
          {" - "}
          <Link color="inherit" href={pkg.author.url} target="_blank">
            {pkg.author.name}
          </Link>
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" align="center">
        {" 2019 - " + new Date().getFullYear()}
      </Typography>
    </div>
  );
}

export default Copyright;
