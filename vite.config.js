import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:1234";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/health": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
