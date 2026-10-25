# Air Conditioner widget

A framework-independent Web Component with a floating air conditioner and a collapsible remote. Supports ESM, CommonJS and TypeScript; no React or Vue host is required.

## npm (recommended)

```bash
npm install @yunlefun-home/air-conditioner-widget
```

```ts
import { cdnAssets, mountAirConditioner } from '@yunlefun-home/air-conditioner-widget'

// On the client, after the DOM is ready. Importing the package during SSR is safe.
const widget = mountAirConditioner(document.body, {
  ...cdnAssets,
  placement: 'top-right', // 'top-left' | 'top-right' | 'inline'
  storageKey: 'my-blog:ac',
  enableAudio: false,
})

// On component / route teardown, release listeners and audio:
// widget.remove()
```

`cdnAssets` explicitly loads fonts, audio and the logo from jsDelivr, pinned to the exact version of the installed npm package. Your application bundles the JavaScript itself. Omit it and provide `assetsBaseUrl` and `logoUrl` to self-host assets. Importing the package does not automatically mount or fetch anything.

You can also call `defineAirConditionerElement({ ...cdnAssets, enableAudio: false })`, then render `<air-conditioner-widget placement="top-right"></air-conditioner-widget>`.

## Script (no build required)

Add this exact-version URL to a site's shared header or footer:

```html
<script defer src="https://cdn.jsdelivr.net/npm/@yunlefun-home/air-conditioner-widget@0.4.3/dist/embed/embed.js" data-placement="top-right"></script>
```

Use `data-placement="top-left"` for the left corner, `data-audio="true"` for audio, and `data-storage-key="my-blog:ac"` for a local storage key. Audio is disabled by default in the script installer. The remote opens on click, touch, Enter, or Space and closes with Escape. Loading the script twice keeps a single widget.

Upgrade by changing the exact version; avoid `latest` in production. [Try the installation demo](https://yunyoujun.github.io/air-conditioner/widget/).

## Self-hosting and offline use

The npm package includes all runtime assets. Copy its `dist/embed/` directory into your site's static directory, for example:

```bash
mkdir -p public/widget
cp -R node_modules/@yunlefun-home/air-conditioner-widget/dist/embed/. public/widget/
```

For the API, replace `...cdnAssets` with `assetsBaseUrl: '/widget/assets'` and `logoUrl: '/widget/yun-logo.svg'`. Include your deployment prefix if applicable. For plain HTML use `<script defer src="/widget/embed.js"></script>`. Keep the assets next to the script. The included `index.html` is the official CDN installation demo; omit it for a strictly offline site.

For use from another origin, serve these files with `Access-Control-Allow-Origin: *`. Sites with a Content Security Policy must allow the chosen origin for scripts, fonts, images, media and fetch, and permit the widget's inline styles.

From source, run `pnpm -C packages/widget build`. `pnpm react:build` also includes the installer under `packages/react/dist/widget/`.

## Source and assets

- Source: https://github.com/YunYouJun/air-conditioner (MIT; see `LICENSE`).
- Font: [Digital-7 by Style-7](https://www.dafont.com/digital-7.font), described upstream as free for personal use.
- Fan recording: [Air Extractor Fan by InspectorJ](https://freesound.org/people/InspectorJ/sounds/403664/), processed by this project.
- The bundle copies the font, button/start sounds and logo from this repository's `packages/react/public/`. Third-party assets retain their own licenses.
