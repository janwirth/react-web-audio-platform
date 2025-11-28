import type { Preview } from "@storybook/react";
import "../src/index.css";
import { AudioContextProvider } from "../src/components/audio-context";
import { DarkModeToggle } from "../src/components/DarkModeToggle";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AudioContextProvider>
        <DarkModeToggle />
        <Story />
      </AudioContextProvider>
    ),
  ],
};

export default preview;
