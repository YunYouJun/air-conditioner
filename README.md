# Air Conditioner

[![Github Pages](https://github.com/YunYouJun/air-conditioner/workflows/Github%20Pages/badge.svg)](https://github.com/YunYouJun/air-conditioner/actions)

云空调，便携小空调，为你的夏日带去清凉！

前世今生：[云空调，便携小空调｜云游君的小站](https://www.yunyoujun.cn/posts/air-conditioner/)

- 裸机：<https://ac.yunyoujun.cn>
- 样板房：<https://www.yunyoujun.cn/air-conditioner-room/>

## Features

### 优势

- 随时随地打开空调
- 便携
- 低功耗（使用 HTML CSS 而非 Canvas 绘制）
- 静音
- 操作简单
- 安装便捷

### 劣势

- 没有风

## 安装

### iframe

```html
<iframe height="740" src="https://ac.yunyoujun.cn"></iframe>
```
您可以快速为您的网站安装空调。  
样板房：[空调房](https://www.yunyoujun.cn/air-conditioner-room/) 
  
### 在您的 Hugo 网站中安装   
  
#### Air Conditioner-Hugo shortcodes  
天气日渐炎热，考虑到朋友浏览 Blog 时，可能心情烦躁，因此提供 Hugo 空调上门安装服务！😄😄  
  
#### Hugo 在线体验  
请移步二楼：https://guole.fun/airconditioner/
  
#### 食用方法 
请移步三楼：https：

### Docker

部署时可使用以下环境变量进行配置自定义：

- `AC_NGINX_DOMAIN` 指定域名
- `AC_NGINX_PORT` 指定监听端口

### 部署

本项目基于腾讯开源项目 [CloudBase Framework](https://github.com/Tencent/cloudbase-framework) [![star](https://img.shields.io/github/stars/Tencent/cloudbase-framework?style=social)](https://github.com/Tencent/cloudbase-framework) 开发部署，支持一键云端部署

[![](https://main.qcloudimg.com/raw/67f5a389f1ac6f3b4d04c7256438e44f.svg)](https://console.cloud.tencent.com/tcb/env/index?action=CreateAndDeployCloudBaseProject&appUrl=https%3A%2F%2Fgithub.com%2FTencentCloudBase-Marketplace%2Fair-conditioner%2F&branch=master)

## Dev

```bash
# yarn dev
yarn start
# http://localhost:3000/

yarn build
# ./build
```

## Todo

- [x] 空调
  - [x] 能耗标签
  - [x] 温度范围（16-31˚C）
  - [x] 风 css
  - [x] 音效
    - [x] 按钮
    - [x] 工作声
    - [ ] 接入 [喜马拉雅](https://m.ximalaya.com/sleepaudio/6?mixedTrackIds=331526646&utm_source=smxkt) 更多音效
- [x] 适应系统的亮暗模式

## Ref

- 数字字体: [Digital 7](https://www.dafont.com/digital-7.font)，Free for personal use
- 空调工作声: [Air Extractor Fan | freesound](https://freesound.org/people/InspectorJ/sounds/403664/)
