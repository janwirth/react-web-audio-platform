import { Column } from "@/components/Column";
import { Waveform } from "@/components/waveform";

const audioUrl = "http://localhost:3001/audio/track1.mp3";

export default function WaveformRendering() {
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
