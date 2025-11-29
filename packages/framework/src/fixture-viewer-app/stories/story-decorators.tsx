import type { Decorator } from "@storybook/react";
import { AudioContextProvider } from "@/components/audio-context";

/**
 * Shared decorators for stories
 * These are applied globally in Storybook via .storybook/preview.tsx
 * but can also be used individually if needed
 */
export const withAudioContext: Decorator = (Story) => (
  <AudioContextProvider>
    <Story />
  </AudioContextProvider>
);
