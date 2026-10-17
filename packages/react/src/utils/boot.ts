/**
 * 首屏骨架（index.html 里的 `#ac-boot`）交接：页面真正画好后调用一次。
 *
 * 骨架和页面布局一致，所以先让页面显示出来，再把骨架盖在上面淡出，看起来是骨架「变成」了真内容，
 * 不会跳动。重复调用无副作用（StrictMode 下 effect 会执行两次）。
 */
export function finishBoot() {
  const boot = document.getElementById('ac-boot')
  document.documentElement.classList.add('ac-booted')
  if (!boot || boot.classList.contains('ac-boot--leaving'))
    return
  boot.classList.add('ac-boot--leaving')
  // 淡出期间读屏和键盘只面对真内容
  boot.setAttribute('aria-hidden', 'true')
  boot.inert = true
  const remove = () => boot.remove()
  boot.addEventListener('animationend', remove, { once: true })
  // 减弱动态效果等情况下没有动画结束事件，兜底移除
  setTimeout(remove, 600)
}
