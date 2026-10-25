# Air Conditioner browser widget

This workspace package provides a Web Component and a standalone browser installer.

## Build and self-host

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm -C packages/widget build:embed
```

Copy the whole `packages/widget/dist/embed/` directory to your website's `/widget/` directory, keeping the assets alongside the script. Open `/widget/` for an installation demo and a snippet using your deployment URL:

```html
<script defer src="/widget/embed.js" data-placement="top-right"></script>
```

Use `data-placement="top-left"` for the left corner, `data-audio="true"` for audio, and `data-storage-key="my-blog:ac"` to choose a local storage key. Audio is disabled by default. The remote opens on click, touch, Enter, or Space and closes with Escape. Loading the script twice keeps a single widget.

For use from another origin, serve the widget files with `Access-Control-Allow-Origin: *`. Sites with a Content Security Policy must allow the script's origin for scripts, fonts, images, media and fetch, and permit the widget's inline styles. To pin a version, build a chosen repository commit and host its output yourself.

`pnpm react:build` also includes this directory under `packages/react/dist/widget/`. The npm package `@air-conditioner/widget` is not published; the browser installer does not require it.

## Source and assets

- Source: https://github.com/YunYouJun/air-conditioner (MIT; see `LICENSE`).
- Font: [Digital-7 by Style-7](https://www.dafont.com/digital-7.font), described upstream as free for personal use.
- Fan recording: [Air Extractor Fan by InspectorJ](https://freesound.org/people/InspectorJ/sounds/403664/), processed by this project.
- The bundle copies the font, button/start sounds and logo from this repository's `packages/react/public/`. Third-party assets retain their own licenses.
