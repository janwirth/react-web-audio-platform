import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WaveformRendering from "./waveform-rendering";
import "@/index.css";
import { AudioContextProvider } from "@/components/audio-context";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AudioContextProvider>
      <WaveformRendering />
    </AudioContextProvider>
  </StrictMode>
);
