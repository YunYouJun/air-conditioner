export function GoogleAdsense() {
  return (
    <div style={{ textAlign: "center" }}>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      ></script>
      {/* 横向广告 */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2245427233262012"
        data-ad-slot="5090291296"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
  );
}
