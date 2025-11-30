import type { Meta, StoryObj } from "@storybook/react";
import { Column } from "@/ui/Column";
import { Waveform } from "@/media/waveform";
import { AudioContextProvider } from "@/media/audio-context";

const audioUrl = "http://localhost:3001/audio/track1.mp3";

function WaveformRendering() {
  return (
    <Column className="h-full w-full p-8" style={{ height: "100%" }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">Waveform Rendering</h1>
        <p className="text-sm opacity-70">{audioUrl}</p>
      </div>
      <div className="flex-1" style={{ minHeight: 0, width: "100%" }}>
        <Waveform audioUrl={audioUrl} height={200} />
      </div>
    </Column>
  );
}

const meta = {
  title: "Stories/Media/WaveformRendering",
  component: WaveformRendering,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AudioContextProvider>
        <Story />
      </AudioContextProvider>
    ),
  ],
} satisfies Meta<typeof WaveformRendering>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
