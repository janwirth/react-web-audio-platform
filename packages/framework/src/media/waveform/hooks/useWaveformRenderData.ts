import { useEffect, useState } from "react";
import { getSpectralData, type SpectralData } from "../lib/frequency-split";
import { getWaveformData } from "../lib/waveform-data";
import { loadAudioBuffer } from "../../audio-context";
import { useAudioContext } from "../../audio-context";
import { defaultCache } from "@/persistence/cache";

/**
 * Combined waveform and spectral data
 * - waveformData: amplitude values (determines bar height)
 * - spectralData: frequency breakdown (determines color distribution)
 */
export interface WaveformRenderData {
  waveformData: number[];
  spectralData: SpectralData[];
}

/**
 * Get cache key based on audioUrl
 */
const getCacheKey = (audioUrl: string): string => {
  return `waveform-data-${audioUrl}`;
};

/**
 * Load cached render data from cache provider
 */
const loadCachedRenderData = async (
  audioUrl: string
): Promise<WaveformRenderData | null> => {
  try {
    const cachedData = await defaultCache.get<WaveformRenderData>(
      getCacheKey(audioUrl)
    );
    if (!cachedData) {
      return null;
    }

    // Only accept valid WaveformRenderData format, discard old formats
    if (
      cachedData &&
      Array.isArray(cachedData.waveformData) &&
      Array.isArray(cachedData.spectralData)
    ) {
      return cachedData;
    }
  } catch (e) {
    // Invalid cache data, ignore
    console.warn("Failed to parse cached waveform data:", e);
  }

  return null;
};

/**
 * Save render data to cache provider
 */
const saveCachedRenderData = async (
  audioUrl: string,
  data: WaveformRenderData
): Promise<void> => {
  try {
    await defaultCache.set(getCacheKey(audioUrl), data);
  } catch (e) {
    console.warn("Failed to save cached waveform data:", e);
  }
};

/**
 * Load and compute both waveform and spectral data together
 * Spectral data depends on waveform data length, so we compute them together
 * Uses cache provider (OPFS by default) if cachedRenderData is not provided
 */
export function useWaveformRenderData(
  audioUrl: string,
  cachedRenderData?: WaveformRenderData | null
): {
  data: WaveformRenderData | null;
  error: string | null;
  loading: boolean;
} {
  const audioContext = useAudioContext();
  const [data, setData] = useState<WaveformRenderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    // Validate audioUrl before attempting to load
    if (!audioUrl || typeof audioUrl !== "string") {
      setError("Invalid audio URL provided");
      setLoading(false);
      return;
    }

    // Async function to handle cache loading
    (async () => {
      // Determine which cached data to use:
      // 1. Use provided cachedRenderData if available
      // 2. Otherwise, try to load from cache provider
      let effectiveCachedData: WaveformRenderData | null = null;

      if (
        cachedRenderData &&
        Array.isArray(cachedRenderData.waveformData) &&
        Array.isArray(cachedRenderData.spectralData)
      ) {
        effectiveCachedData = cachedRenderData;
      } else {
        // Try loading from cache provider as default cache strategy
        effectiveCachedData = await loadCachedRenderData(audioUrl);
      }

      // If we have cached render data with both waveform and spectral data, use it directly
      // Do NOT load the audio buffer if we have cached data
      if (effectiveCachedData) {
        setData(effectiveCachedData);
        setError(null);
        setLoading(false);
        return;
      }

      // Otherwise, load audio and compute data
      loadAudioBuffer(audioContext, audioUrl)
        .then((buffer: AudioBuffer) => {
          // Compute waveform data first (determines resolution)
          const waveformData = getWaveformData(buffer, 600);
          // Then compute spectral data (needs waveform length)
          const spectralData = getSpectralData(buffer, waveformData);
          const renderData = { waveformData, spectralData };

          // Save to cache provider as default cache strategy
          saveCachedRenderData(audioUrl, renderData);

          setData(renderData);
          setError(null);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error("Failed to load audio:", err);
          setError(errorMessage);
          setData(null);
          setLoading(false);
        });
    })();
  }, [audioUrl, audioContext, cachedRenderData]);

  return { data, error, loading };
}

