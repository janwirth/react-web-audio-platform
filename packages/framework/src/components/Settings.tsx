import { useEffect } from "react";
import { useAtom } from "jotai";
import {
  hueAtom,
  saturationAtom,
  hueSpreadAtom,
  contrastAtom,
  lightnessAtom,
} from "@/hooks/useData";
import { ColorPicker } from "./inputs/ColorPicker";

const STORAGE_KEY_PREFIX = "waveform-color-settings-";

const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
};

export function Settings() {
  const [hue, setHue] = useAtom(hueAtom);
  const [saturation, setSaturation] = useAtom(saturationAtom);
  const [hueSpread, setHueSpread] = useAtom(hueSpreadAtom);
  const [contrast, setContrast] = useAtom(contrastAtom);
  const [lightness, setLightness] = useAtom(lightnessAtom);

  // Save to localStorage whenever values change
  useEffect(() => {
    saveToStorage("hue", hue);
  }, [hue]);

  useEffect(() => {
    saveToStorage("saturation", saturation);
  }, [saturation]);

  useEffect(() => {
    saveToStorage("hueSpread", hueSpread);
  }, [hueSpread]);

  useEffect(() => {
    saveToStorage("contrast", contrast);
  }, [contrast]);

  useEffect(() => {
    saveToStorage("lightness", lightness);
  }, [lightness]);

  return (
    <div className="w-full px-4 py-2 flex items-center justify-center font-mono">
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
    </div>
  );
}

