import type { CSSProperties } from 'react'
import React from 'react'
import * as pkg from '~/../package.json'
import './Copyright.scss'

const socialList = [
  {
    type: 'github',
    color: 'currentColor',
    icon: 'i-mdi-github',
    label: 'GitHub: YunYouJun',
    href: 'https://github.com/YunYouJun',
  },
  {
    type: 'telegram',
    color: '#1da1f2',
    icon: 'i-mdi-telegram',
    label: 'Telegram Channel',
    href: 'https://t.me/elpsycn',
  },
  {
    type: 'weibo',
    color: '#DB2828',
    icon: 'i-mdi-sina-weibo',
    label: '微博：机智的云游君',
    href: 'http://weibo.com/jizhideyunyoujun',
  },
  {
    type: 'twitter',
    color: '#1da1f2',
    icon: 'i-mdi-twitter',
    label: 'Twitter: YunYouJun',
    href: 'https://twitter.com/YunYouJun',
  },
  {
    type: 'wechat',
    color: '#1AAD19',
    icon: 'i-mdi-wechat',
    label: '微信公众号：云游君',
    href: 'https://cdn.yunyoujun.cn/img/about/white-qrcode-and-search.jpg',
  },
  {
    type: 'blog',
    color: '#6435C9',
    icon: 'i-mdi-earth',
    label: '博客：yunyoujun.cn',
    href: 'http://www.yunyoujun.cn',
  },
]

const sponsorsLink = 'https://sponsors.yunyoujun.cn'

/**
 * 页脚：一本折起来的空调使用说明书，点开才展开常见问题、电费与售后服务
 */
const Copyright: React.FC = () => {
  const years = `2019 – ${new Date().getFullYear()}`

  return (
    <footer className="ac-manual ac-text">
      <details className="ac-manual__book">
        <summary className="ac-manual__cover">
          <span className="i-mdi-book-open-page-variant-outline" aria-hidden="true" />
          <span>使用说明书</span>
          <span className="ac-manual__en">MANUAL</span>
          <span className="i-mdi-chevron-down ac-manual__chevron" aria-hidden="true" />
        </summary>

        <div className="ac-manual__pages">
          <header className="ac-manual__head">
            <div>
              <a href={pkg.repository.url} target="_blank" rel="noreferrer">
                Yun Air Conditioner
              </a>
              <div className="ac-manual__sub">便携小空调 · 使用说明书</div>
            </div>
            <div className="ac-manual__model">
              型号
              <br />
              YAC-
              {pkg.version}
            </div>
          </header>

          <section>
            <h3>
              <span className="ac-manual__num">1</span>
              常见问题
            </h3>
            <dl className="ac-manual__faq">
              <dt>感觉不到风？</dt>
              <dd>本产品为云空调，制冷主要依靠心理作用。请心静，自然凉。</dd>
              <dt>会产生电费吗？</dt>
              <dd>
                不会。本机电费
                <a href={sponsorsLink} target="_blank" rel="noreferrer">
                  由赞助者承担
                  <span className="i-mdi-cloud ac-manual__cloud" aria-hidden="true" />
                </a>
                。
              </dd>
              <dt>出现故障？</dt>
              <dd>请先关机再开机（万能方法），仍无效请联系售后服务。</dd>
            </dl>
          </section>

          <section>
            <h3>
              <span className="ac-manual__num">2</span>
              售后服务
            </h3>
            <div className="ac-manual__social">
              {socialList.map(item => (
                <a
                  key={item.type}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  title={item.label}
                  aria-label={item.label}
                  style={{ '--brand': item.color } as CSSProperties}
                >
                  <span className={item.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          <p className="ac-manual__keep">请妥善保管本说明书</p>
        </div>
      </details>

      <p className="ac-manual__copyright">
        {`© ${years} `}
        <a href={pkg.author.url} target="_blank" rel="noreferrer">
          云游君 @
          {pkg.author.name}
        </a>
      </p>
    </footer>
  )
}

export default Copyright
