import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@janwirth/react-web-audio-context": resolve(
        __dirname,
        "../react-web-audio-context/src/index.ts"
      ),
      "@janwirth/react-mini-audio-waveform": resolve(
        __dirname,
        "../react-mini-audio-waveform/src/index.ts"
      ),
    },
  },
});

