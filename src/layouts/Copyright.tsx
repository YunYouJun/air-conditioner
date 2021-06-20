import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import * as pkg from "../../package.json";

import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

import Icon from "@mdi/react";
import { mdiGithub } from "@mdi/js";
import { mdiTelegram } from "@mdi/js";
import { mdiSinaWeibo } from "@mdi/js";
import { mdiTwitter } from "@mdi/js";
import { mdiWechat } from "@mdi/js";
import { mdiEarth } from "@mdi/js";
import { mdiCloud } from "@mdi/js";

const socialList = [
  {
    type: "github",
    color: "black",
    icon: mdiGithub,
    label: `GitHub: YunYouJun`,
    href: `https://github.com/YunYouJun`,
  },
  {
    type: "telegram",
    color: "#1da1f2",
    icon: mdiTelegram,
    label: "Telegram Channel",
    href: "https://t.me/elpsycn",
  },
  {
    type: "weibo",
    color: "#DB2828",
    icon: mdiSinaWeibo,
    label: "微博：机智的云游君",
    href: "http://weibo.com/jizhideyunyoujun",
  },
  {
    type: "twitter",
    color: "#1da1f2",
    icon: mdiTwitter,
    label: "Twitter: YunYouJun",
    href: "https://twitter.com/YunYouJun",
  },
  {
    type: "wechat",
    color: "#1AAD19",
    icon: mdiWechat,
    label: "微信公众号：云游君",
    href: "https://cdn.jsdelivr.net/gh/YunYouJun/cdn/img/about/white-qrcode-and-search.jpg",
  },
  {
    type: "blog",
    color: "#6435C9",
    icon: mdiEarth,
    label: "博客：yunyoujun.cn",
    href: "http://www.yunyoujun.cn",
  },
];

function Copyright() {
  return (
    <div>
      <Box>
        <Typography variant="body2" color="textSecondary" align="center">
          {"© "}
          <Link color="inherit" href={pkg.repository.url} target="_blank">
            Yun Air Conditioner
          </Link>
          <IconButton
            sx={{ color: "#0078e7" }}
            href="https://sponsors.yunyoujun.cn"
            target="_blank"
          >
            <Icon path={mdiCloud} size={0.6}></Icon>
          </IconButton>
          <Link color="inherit" href={pkg.author.url} target="_blank">
            {pkg.author.name}
          </Link>
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" align="center">
        {" 2019 - " + new Date().getFullYear()}
      </Typography>
      <Box style={{ textAlign: "center" }}>
        {socialList.map((item) => (
          <Tooltip title={item.label} arrow>
            <IconButton
              sx={{ color: item.color }}
              href={item.href}
              target="_blank"
            >
              <Icon path={item.icon} size={1} />
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </div>
  );
}

export default Copyright;
