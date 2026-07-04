import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // SwiftLaTeX's WASM engine fetches individual TeX package/format files
      // from a texlive CDN at runtime. The official texlive2.swiftlatex.com
      // mirror has gone offline, so we use the community-maintained
      // texlive.texlyre.org mirror instead (github.com/TeXlyre/texlive-ondemand-server).
      // Proxying same-origin also sidesteps any future CORS restrictions.
      // Compilation itself still runs 100% client-side.
      "/texlive-proxy": {
        target: "https://texlive.texlyre.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/texlive-proxy/, ""),
      },
    },
  },
});
