import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';

const meta = {
  title: 'Stories/Ui/Inputs/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveColorPicker = (args: any) => {
  const [hue, setHue] = useState(args.hue || 180);
  const [saturation, setSaturation] = useState(args.saturation || 0.2);
  const [hueSpread, setHueSpread] = useState(args.hueSpread || 60);
  const [contrast, setContrast] = useState(args.contrast || 0);
  const [lightness, setLightness] = useState(args.lightness || 0.5);

  return (
    <ColorPicker
      hue={hue}
      saturation={saturation}
      hueSpread={hueSpread}
      contrast={contrast}
      lightness={lightness}
      onHueChange={setHue}
      onSaturationChange={setSaturation}
      onHueSpreadChange={setHueSpread}
      onContrastChange={setContrast}
      onLightnessChange={setLightness}
    />
  );
};

export const Default: Story = {
  render: InteractiveColorPicker,
  args: {
    hue: 180,
    saturation: 0.2,
    hueSpread: 60,
    contrast: 0,
    lightness: 0.5,
  },
};

export const HighSaturation: Story = {
  render: InteractiveColorPicker,
  args: {
    hue: 240,
    saturation: 0.4,
    hueSpread: 90,
    contrast: 0.2,
    lightness: 0.6,
  },
};

export const LowSaturation: Story = {
  render: InteractiveColorPicker,
  args: {
    hue: 0,
    saturation: 0.05,
    hueSpread: 30,
    contrast: -0.3,
    lightness: 0.4,
  },
};

