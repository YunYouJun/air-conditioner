/**
 * 把 Vue 组件的 style.css 转换成 Web Component 的 Shadow DOM 样式：
 * - 去掉 @font-face（Shadow DOM 内声明的字体不会生效，改由组件注入到 document）
 * - `:root` 换成 `:host`
 * - 补上宿主元素自身的尺寸
 *
 * @param {string} css Vue 组件的 style.css 内容
 * @returns {string} Shadow DOM 样式文本
 */
export function toShadowStyle(css) {
  const withoutFontFace = css.replace(/^\/\*[\s\S]*?\*\/\s*@font-face\s*\{[^}]*\}\s*/, '')
  const host = `:host {
  display: inline-block;
  /* 宽度相对宿主容器确定，避免 inline-block 收缩到遥控器宽度把机身挤窄 */
  width: min(420px, 100%);
}

`
  return host + withoutFontFace.replaceAll(':root', ':host')
}

/**
 * 生成 `src/style.ts` 的完整内容。
 *
 * @param {string} css Vue 组件的 style.css 内容
 */
export function renderStyleModule(css) {
  const text = toShadowStyle(css).replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')
  return `// 由 scripts/sync-style.mjs 根据 packages/vue/src/style.css 生成，请勿手动修改。
// 修改样式后运行：pnpm -C packages/widget run sync:style
export const widgetStyleText = \`${text}\`
`
}
