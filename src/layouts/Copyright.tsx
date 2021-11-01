import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import * as pkg from '~/../package.json'

import IconGithub from '~icons/mdi/github'
import IconTelegram from '~icons/mdi/telegram'
import IconSinaWeibo from '~icons/mdi/sina-weibo'
import IconTwitter from '~icons/mdi/twitter'
import IconWechat from '~icons/mdi/wechat'
import IconEarth from '~icons/mdi/earth'
import IconCloud from '~icons/mdi/cloud'

const socialList = [
  {
    type: 'github',
    color: 'inherit',
    icon: IconGithub,
    label: 'GitHub: YunYouJun',
    href: 'https://github.com/YunYouJun',
  },
  {
    type: 'telegram',
    color: '#1da1f2',
    icon: IconTelegram,
    label: 'Telegram Channel',
    href: 'https://t.me/elpsycn',
  },
  {
    type: 'weibo',
    color: '#DB2828',
    icon: IconSinaWeibo,
    label: '微博：机智的云游君',
    href: 'http://weibo.com/jizhideyunyoujun',
  },
  {
    type: 'twitter',
    color: '#1da1f2',
    icon: IconTwitter,
    label: 'Twitter: YunYouJun',
    href: 'https://twitter.com/YunYouJun',
  },
  {
    type: 'wechat',
    color: '#1AAD19',
    icon: IconWechat,
    label: '微信公众号：云游君',
    href: 'https://cdn.jsdelivr.net/gh/YunYouJun/cdn/img/about/white-qrcode-and-search.jpg',
  },
  {
    type: 'blog',
    color: '#6435C9',
    icon: IconEarth,
    label: '博客：yunyoujun.cn',
    href: 'http://www.yunyoujun.cn',
  },
]

export const Copyright: React.FC = () => {
  return (
    <div>
      <p className="text-center text-xs">
        {'© '}
        <a href={pkg.repository.url} target="_blank" rel="noreferrer">
          Yun Air Conditioner
        </a>
        <IconButton
          sx={{ color: '#0078e7' }}
          href="https://sponsors.yunyoujun.cn"
          target="_blank"
        >
          <IconCloud style={{ fontSize: '1rem' }} />
        </IconButton>
        &nbsp;
        <a href={pkg.author.url} target="_blank" rel="noreferrer">
          云游君 @{pkg.author.name}
        </a>
      </p>
      <p className="text-center text-xs">
        {`2019 - ${new Date().getFullYear()}`}
      </p>
      <div className="text-center">
        {socialList.map(item => (
          <Tooltip title={item.label} arrow key={item.type}>
            <IconButton
              sx={{ color: item.color }}
              href={item.href}
              target="_blank"
            >
              <item.icon />
            </IconButton>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export default Copyright
