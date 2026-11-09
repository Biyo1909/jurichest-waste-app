import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = { "/functions/v1/app": "http://127.0.0.1:8000" };

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/components/ui", replacement: fileURLToPath(new URL("./components/ui", import.meta.url)) },
      { find: "@/lib/utils", replacement: fileURLToPath(new URL("./lib/utils", import.meta.url)) },
      { find: "@/hooks", replacement: fileURLToPath(new URL("./hooks", import.meta.url)) },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  server: { host: "127.0.0.1", proxy },
  preview: { host: "127.0.0.1", proxy },
  build: { outDir: "dist" },
});
