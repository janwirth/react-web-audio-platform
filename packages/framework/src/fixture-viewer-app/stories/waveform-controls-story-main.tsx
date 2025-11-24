import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WaveformControlsStory from "./waveform-controls-story";
import "@/index.css";
import { AudioContextProvider } from "@/components/audio-context";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AudioContextProvider>
      <WaveformControlsStory />
    </AudioContextProvider>
  </StrictMode>
);

