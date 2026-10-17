import type { FC } from 'react'
import useDark from '~/hooks/useDark'
import { adsenseLink, jumpToAdsense } from '~/utils/adsense'

/**
 * 广告导流链接
 * @param props
 */
const AdsenseLink: FC<{ text: string }> = (props) => {
  return (
    <a
      className="adsense-text-link"
      href={adsenseLink}
      target="_blank"
      onClick={() => {
        jumpToAdsense()
      }}
      rel="noreferrer"
    >
      {props.text}
    </a>
  )
}

const ProTip: FC = () => {
  const { toggleDark } = useDark()

  return (
    <div
      className="m-6 text-center flex justify-center items-center"
    >
      <div className="i-mdi-lightbulb-outline text-xl cursor-pointer" style={{ color: '#f3a83b' }} onClick={toggleDark}></div>
      Tip: 为你的夏日带去
      {import.meta.env.VITE_DISABLE_ADSENSE
        ? (
            '清凉'
          )
        : (
            <AdsenseLink text="清凉" />
          )}
      ！
    </div>
  )
}

export default ProTip
