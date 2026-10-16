<h1 align="center">
Air Conditioner
</h1>

<p align="center">
<a href="https://github.com/YunYouJun/air-conditioner/actions" target="_blank">
<img src="https://github.com/YunYouJun/air-conditioner/workflows/Github%20Pages/badge.svg" alt="GitHub Pages" />
</a>
</p>

<p align="center">
中文文档 | <a href="./README.en.md">English Docs</a>
</p>

<p align="center">

[云空调](https://ac.yunyoujun.cn)，便携小空调，为你的夏日带去清凉！

</p>
<br>

> 前世今生：[云空调，便携小空调｜云游君的小站](https://www.yunyoujun.cn/posts/air-conditioner/)

| 仓库 | 类型 | 链接 |
| --- | --- | --- |
| 裸机 | main | [ac.yunyoujun.cn](https://ac.yunyoujun.cn) |
| 测试机 | dev | [ac.yyj.moe](https://ac.yyj.moe) |
| 样板房 | 空调房 | [https://www.yunyoujun.cn/air-conditioner-room/](https://www.yunyoujun.cn/air-conditioner-room/) |

## Features

### 优势

- 🕐 随时随地打开空调
- 📱 便携
- 🔋 低功耗（使用 HTML CSS 而非 Canvas 绘制）
- 🔊 静音
- 🎮 操作简单
- 🔧 安装便捷

### 劣势

- 💨 没有风

## 安装

### iframe

```html
<iframe height="740" src="https://ac.yunyoujun.cn"></iframe>
```

您可以快速为您的网站安装空调。

样板房：[空调房](https://www.yunyoujun.cn/air-conditioner-room/)

### 上门服务

- Hugo: <https://github.com/kuole-o/Hugo-air-conditioner>

## 自行部署

### Docker

部署时可使用以下环境变量进行配置自定义：

- `AC_NGINX_DOMAIN` 指定域名
- `AC_NGINX_PORT` 指定监听端口

### 腾讯云

使用 [腾讯云 Webify](https://webify.cloudbase.net/) 一键部署：

[![cloudbase](https://cloudbase.net/deploy.svg)](https://console.cloud.tencent.com/webify/new?tpl=https%3A%2F%2Fgithub.com%2FYunYouJun%2Fair-conditioner&reponame=my-air-conditioner)

## Dev

```bash
# 开发预览
# yarn dev
yarn start
# http://localhost:3000/

# 构建项目
yarn build
# ./build
```

### 环境变量

```bash
cp .env.example .env
```

```bash
# 关闭广告
VITE_DISABLE_ADSENSE=true
```

## 发布

`@yunlefun-home/air-conditioner-core` 与 `@yunlefun-home/air-conditioner` 通过 GitHub Actions 的 npm 可信发布（OIDC）发版，无需 npm Token 或一次性密码，并自动附带来源证明（provenance）。

```bash
pnpm release
```

`bumpp` 同步更新版本、提交并推送 `v*` Tag，[Release 工作流](.github/workflows/release.yml) 随即检查、构建并按 core → vue 的顺序发布。预发布版本（如 `0.4.0-beta.1`）发布到同名 dist-tag，已存在的版本会被跳过。也可在 Actions 中手动运行该工作流，发布当前分支上的版本。

首次使用前，需要在 npmjs.com 两个包的 Settings → Trusted publishing 中添加 GitHub Actions：仓库 `YunYouJun/air-conditioner`，工作流 `release.yml`。

## Todo

- [x] 空调
  - [x] 能耗标签
  - [x] 温度范围（16-31˚C）
  - [x] 风 css
  - [x] 音效
    - [x] 按钮
    - [x] 工作声
- [x] 适应系统的亮暗模式

## Ref

- 数字字体: [Digital 7](https://www.dafont.com/digital-7.font)，Free for personal use
- 空调工作声: [Air Extractor Fan | freesound](https://freesound.org/people/InspectorJ/sounds/403664/)

## [Sponsors](https://sponsors.yunyoujun.cn)

<p align="center">
  <a href="https://sponsors.yunyoujun.cn">
    <img src='https://fastly.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg' alt="Sponsors"/>
  </a>
</p>
