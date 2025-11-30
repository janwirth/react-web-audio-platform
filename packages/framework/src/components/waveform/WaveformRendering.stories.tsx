import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@/components/Column';
import { Waveform } from '@/components/waveform';

const meta = {
  title: 'Waveform/WaveformRendering',
  component: Waveform,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Waveform>;

export default meta;
type Story = StoryObj<typeof meta>;

const audioUrl = 'http://localhost:3001/audio/track1.mp3';

export const Default: Story = {
  render: () => (
    <Column className="h-full w-full p-8" style={{ height: '100vh' }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">Waveform Rendering</h1>
        <p className="text-sm opacity-70">{audioUrl}</p>
      </div>
      <div className="flex-1" style={{ minHeight: 0, width: '100%' }}>
        <Waveform audioUrl={audioUrl} height={200} />
      </div>
    </Column>
  ),
};



