import { themes } from '@storybook/theming';
import '../src/index.css';

/** @type {import('@storybook/react').Preview} */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      // Override the default dark theme
      dark: { ...themes.dark, appBg: '#000000' },
      // Override the default light theme
      light: { ...themes.normal, appBg: '#ffffff' },
      // Set the initial theme based on OS preference
      current: 'light',
      // Apply dark/light class to preview iframe
      stylePreview: true,
      // Apply class to html element (for Tailwind dark mode)
      classTarget: 'html',
      // Custom class names
      darkClass: 'dark',
      lightClass: '',
    },
  },
};

export default preview;

