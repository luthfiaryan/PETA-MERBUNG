import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "peta-admin": resolve(__dirname, "peta-admin/index.html"),
        "peta-fasum": resolve(__dirname, "peta-fasum/index.html"),
        "peta-umkm": resolve(__dirname, "peta-umkm/index.html"),
      },
    },
  },
});
