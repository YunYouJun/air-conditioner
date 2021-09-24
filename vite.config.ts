import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";

import Icons from "unplugin-icons/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`,
    },
  },
  plugins: [
    reactRefresh(),
    Icons({ compiler: "jsx", jsx: "react" }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "便携小空调",
        short_name: "云空调",
        theme_color: "#000000",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        icons: [
          {
            src: "favicon.svg",
            type: "image/png",
            sizes: "64x64",
          },
        ],
      },
    }),
  ],
});
