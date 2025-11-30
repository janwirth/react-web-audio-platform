import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { VerticalSlider } from './VerticalSlider';

const meta = {
  title: 'Components/Inputs/VerticalSlider',
  component: VerticalSlider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VerticalSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveSlider = (args: any) => {
  const [value, setValue] = useState(args.value || 50);
  return <VerticalSlider {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: InteractiveSlider,
  args: {
    label: 'VAL',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    polarity: 'normal',
  },
};

export const OffsetPolarity: Story = {
  render: InteractiveSlider,
  args: {
    label: 'OFF',
    value: 0,
    min: -1,
    max: 1,
    step: 0.01,
    polarity: 'offset',
  },
};

export const WithStep: Story = {
  render: InteractiveSlider,
  args: {
    label: 'STEP',
    value: 5,
    min: 0,
    max: 10,
    step: 0.5,
    polarity: 'normal',
  },
};

