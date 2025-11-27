import type { Preview } from '@storybook/react';
import '../src/index.css';
import { AudioContextProvider } from '../src/components/audio-context';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AudioContextProvider>
        <Story />
      </AudioContextProvider>
    ),
  ],
};

export default preview;

