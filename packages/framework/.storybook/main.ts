import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  core: {
    builder: "@storybook/builder-vite",
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@": resolve(__dirname, "../src"),
          "@janwirth/react-web-audio-context": resolve(
            __dirname,
            "../../react-web-audio-context/src/index.ts"
          ),
          "@janwirth/react-mini-audio-waveform": resolve(
            __dirname,
            "../../react-mini-audio-waveform/src/index.ts"
          ),
        },
      },
      worker: {
        format: "es",
      },
      optimizeDeps: {
        exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
      },
    });
  },
};

export default config;
