import { defineConfig } from "vite"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(
          __dirname,
          "src",
          "scripts",
          "service-worker",
          "background.ts",
        ),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") {
            return "background.js"
          }
          return "assets/[name]-[hash].js"
        },
      },
    },
  },
})
