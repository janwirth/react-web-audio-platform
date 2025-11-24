import type { Meta, StoryObj } from '@storybook/react';
import { DarkModeToggle } from './DarkModeToggle';

const meta = {
  title: 'Components/DarkModeToggle',
  component: DarkModeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DarkModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LightMode: Story = {
  parameters: {
    darkMode: {
      current: 'light',
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    darkMode: {
      current: 'dark',
    },
  },
};

