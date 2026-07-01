import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

console.log("Vite config loaded");

const apiProxy = {
  "/api": "http://localhost:5000",
  "/uploads": "http://localhost:5000",
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: apiProxy,
    host: true,
    allowedHosts: true,
  },
  // vite preview (PM2 prod) has no dev proxy unless configured here
  preview: {
    proxy: apiProxy,
    host: true,
  },
});
