# 独立文档部署：Cloudflare Pages

独立文档站已部署至 [docs.ac.yunyoujun.cn](https://docs.ac.yunyoujun.cn)。文档保留在本仓库，独立于 React 主站构建；主站的 Vercel、GitHub Pages 与已有 Cloudflare Pages 项目保持不变。

## Pages Git 集成设置（已部署）

- 仓库：`YunYouJun/air-conditioner`。
- 独立文档 Pages 项目：`air-conditioner-docs`（默认域名 `air-conditioner-docs.pages.dev`，自定义域名 `docs.ac.yunyoujun.cn` 已激活 Google Trust Services 证书，Zone `yunyoujun.cn` 下配置代理 CNAME `docs.ac.yunyoujun.cn -> air-conditioner-docs.pages.dev`）。主站项目仍为 `air-conditioner`（`air-conditioner-eut.pages.dev`，绑定 `ac.yunyoujun.cn` / `ac.yyj.moe`），另有历史项目 `air-conditioner-adsense`。
- 根目录：仓库根目录（留空），不要设为 `docs`，因为文档引用 workspace 的 core / widget 源码。
- 构建系统：使用 Cloudflare Pages 构建镜像 v3；框架预设为 VitePress 或 None，以以下显式配置为准。
- 构建命令：`pnpm install --frozen-lockfile && pnpm docs:build`。
- 输出目录：`docs/.vitepress/dist`。
- 环境变量（Production 与 Preview 一致）：
  - `NODE_VERSION=24`（受支持 LTS 版本；注意 GitHub Actions 的 `lts/*` 随新 LTS 推进，如需对齐主版本可统一调整）
  - `PNPM_VERSION=12.11.2`（与根目录 `packageManager` 一致）
  - `SKIP_DEPENDENCY_INSTALL=1`（跳过平台预装阶段的重复/旧版安装，由显式 `build_command` 执行 `pnpm install --frozen-lockfile`）
- 文档不需要 API key、服务端 Functions、运行时环境变量或 `VITE_BASE`。独立域名使用 VitePress 默认根路径 `/`。
- 生产分支为 `main`；PR 分支自动构建预览环境。

如未设置 `SKIP_DEPENDENCY_INSTALL=1` 且平台自动安装依赖已启用，上述显式 frozen-lockfile 安装仍用于验证锁文件一致性。不要修改仓库的 packageManager 来迁就平台默认版本。

## 本地 / CI 验证

在仓库根目录运行 `pnpm install --frozen-lockfile`、`pnpm docs:build` 和 `pnpm docs:preview`。构建不依赖预先生成的 core dist；文档配置直接解析 core 源码。Playwright 在独立端口预览生产构建并验证安装演示。

发布前或变更后检查首页、`/guide/floating-widget`、字体与脚本资源、404、深色模式、移动导航、悬浮遥控器和离页清理。不要添加 React 的 `/* → /index.html` SPA 回退规则到文档项目；VitePress 已生成独立页面及 404。

## 上线核验记录

1. 已创建独立 Pages 项目 `air-conditioner-docs` 并关联 GitHub 仓库 `YunYouJun/air-conditioner`（生产分支 `main`）。
2. 已配置上述构建命令、输出目录与构建镜像 v3 环境变量。
3. 已核验预览地址 `https://air-conditioner-docs.pages.dev/` 与 `/guide/floating-widget` 返回 HTTP 200，不存在路径返回 404。
4. 已完成 `docs.ac.yunyoujun.cn` 自定义域名绑定、DNS CNAME 配置与 HTTPS 证书激活。
5. 已验证 `https://docs.ac.yunyoujun.cn/` 与 `/guide/floating-widget` 正常返回文档页面，并同步更新 README 公开链接。

参考：[Cloudflare VitePress 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vitepress-site/)、[构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)、[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。
