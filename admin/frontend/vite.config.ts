import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 0.0.0.0 이어야 컨테이너 밖에서 붙을 수 있다. 기본값(localhost)이면 컨테이너
    // 안 루프백에만 바인딩돼 docker compose 로 띄웠을 때 접속이 거부된다.
    // 로컬에서 npm run dev 로 띄울 때도 그대로 localhost:5173 으로 열린다.
    host: true,
    port: 5173,
    proxy: {
      "/api/logs": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
