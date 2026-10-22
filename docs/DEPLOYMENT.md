# 独立文档部署：Cloudflare Pages

目标域名为 `docs.ac.yunyoujun.cn`，目前仅为部署计划，不代表已绑定或可访问。文档保留在本仓库，独立于 React 主站构建；不要修改主站的 Vercel、GitHub Pages 或已有 Cloudflare Pages 项目。

## Pages Git 集成设置（待确认后配置）

- 仓库：`YunYouJun/air-conditioner`。
- 使用独立的文档 Pages 项目，项目名称由账号管理员确认，不假定已有项目。
- 根目录：仓库根目录（留空），不要设为 `docs`，因为文档引用 workspace 的 core / widget 源码。
- 框架预设：VitePress 或 None，以以下显式配置为准。
- 构建命令：`pnpm install --frozen-lockfile && pnpm docs:build`。
- 输出目录：`docs/.vitepress/dist`。
- Node.js：使用项目 CI 相同的受支持 LTS 版本；建议显式设置 `NODE_VERSION=24`。
- pnpm：设置 `PNPM_VERSION=12.11.2`，与根目录 `packageManager` 一致。
- 文档不需要 API key、服务端 Functions、运行时环境变量或 `VITE_BASE`。独立域名使用 VitePress 默认根路径 `/`。
- 生产分支计划为 `main`；预览可使用 PR 分支。首次创建项目或接入 Git 可能自动部署，必须先确认。

若平台自动安装依赖已启用，上述显式 frozen-lockfile 安装仍用于验证锁文件一致性。不要修改仓库的 packageManager 来迁就平台默认版本。

## 本地 / CI 验证

在仓库根目录运行 `pnpm install --frozen-lockfile`、`pnpm docs:build` 和 `pnpm docs:preview`。构建不依赖预先生成的 core dist；文档配置直接解析 core 源码。Playwright 在独立端口预览生产构建并验证安装演示。

发布前检查首页、`/guide/floating-widget`、字体与脚本资源、404、深色模式、移动导航、悬浮遥控器和离页清理。不要添加 React 的 `/* → /index.html` SPA 回退规则到文档项目；VitePress 已生成独立页面及 404。

## 平台侧待确认项

1. 确认 Cloudflare 账号内是否已有专用文档 Pages 项目，及现有 GitHub 集成权限。
2. 确认新建 / 修改目标项目及其构建设置的具体变更。
3. 先验证平台返回的实际预览地址；不要猜测 `*.pages.dev` 地址。
4. 单独确认绑定 `docs.ac.yunyoujun.cn`，按 Pages 提示完成 DNS 和证书验证。
5. 域名实际返回正确文档且验证通过后，再把它写成公开可用的 README 链接。

本 PR 不创建 Pages 项目、不修改 DNS、不绑定域名、不增加 OAuth / token，也不触发生产发布。

参考：[Cloudflare VitePress 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vitepress-site/)、[构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)、[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。
