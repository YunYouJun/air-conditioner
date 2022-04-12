import type { FC } from 'react'
import { adsenseLink, jumpToAdsense } from '~/utils/adsense'
import useDark from '~/hooks/useDark'

/**
 * 喜马拉雅链接
 * @param props
 * @returns
 */
const AdsenseLink: FC<{ text: string }> = (props) => {
  return (
    <a
      className="adsense-text-link"
      href={adsenseLink}
      target="_blank"
      onClick={() => {
        jumpToAdsense()
      }} rel="noreferrer"
    >
      {props.text || '喜马拉雅'}
    </a>
  )
}

const ProTip: FC = () => {
  const { toggleDark } = useDark()

  return (
    <p
      className="text-center"
      style={{
        margin: 24,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="i-ic:outline-emoji-objects text-xl cursor-pointer" style={{ color: '#f3a83b' }} onClick={toggleDark}></div>
      Tip: 为你的夏日带去
      {import.meta.env.VITE_DISABLE_ADSENSE
        ? (
          '清凉'
        )
        : (
          <AdsenseLink text="清凉" />
        )}
      ！
    </p>
  )
}

export default ProTip
