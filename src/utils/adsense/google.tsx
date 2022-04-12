/**
 * 谷歌自动广告
 * @returns
 */
export function GoogleAutoAdsense() {
  return (
    <script
      data-ad-client="ca-pub-2245427233262012"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
    ></script>
  )
}

/**
 * 谷歌广告单元
 * @returns
 */
export function GoogleAdsenseUnit() {
  return (
    <div style={{ textAlign: 'center' }}>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      ></script>
      {/* 横向广告 */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          minWidth: 400,
          maxWidth: 970,
          width: '100%',
          height: 90,
        }}
        data-ad-client="ca-pub-2245427233262012"
        data-ad-slot="5090291296"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
  )
}
