import { useState, useEffect, useRef } from "react";
import {
  useAudioContext,
  queueAudioTask,
} from "./AudioContextProvider";
import { decodeAudioFile } from "./audio-loader";

// Cache to track pending audio buffer requests
// Key: audio URL, Value: Promise<AudioBuffer>
const pendingRequests = new Map<string, Promise<AudioBuffer>>();

/**
 * Load an audio buffer with shared resolution guarantees.
 * If multiple requests are made for the same URL, they will all resolve when the first one completes.
 *
 * @param audioContext - The AudioContext to use for decoding
 * @param audioUrl - The URL of the audio file to load
 * @returns A Promise that resolves to the AudioBuffer
 */
export function loadAudioBuffer(
  audioContext: AudioContext,
  audioUrl: string
): Promise<AudioBuffer> {
  // Check if there's already a pending request for this URL
  const existingRequest = pendingRequests.get(audioUrl);
  if (existingRequest) {
    return existingRequest;
  }

  // Create a new request
  const requestPromise = queueAudioTask(audioContext, async (ctx) => {
    return await decodeAudioFile(audioUrl, ctx);
  });

  // Store the pending request
  pendingRequests.set(audioUrl, requestPromise);

  // Clean up when the request completes (success or failure)
  // Use a delay to allow other components that mounted during the request
  // to also get the result before we clear the cache
  requestPromise.finally(() => {
    setTimeout(() => {
      // Only delete if this is still the same promise (not replaced by a retry)
      if (pendingRequests.get(audioUrl) === requestPromise) {
        pendingRequests.delete(audioUrl);
      }
    }, 100);
  });

  return requestPromise;
}

/**
 * Dequeue/remove a pending audio buffer request from the cache.
 * This is useful for cleanup or forcing a re-fetch.
 */
export function dequeueAudioBufferRequest(audioUrl: string): void {
  pendingRequests.delete(audioUrl);
}

/**
 * Hook to load an audio buffer with deduplication.
 * Multiple components requesting the same URL will share the same loading promise.
 *
 * @param audioUrl - The URL of the audio file to load
 * @returns Object with audioBuffer, loading state, and error state
 */
export function useAudioBuffer(audioUrl: string | null) {
  const audioContext = useAudioContext();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Reset state when URL changes
    setAudioBuffer(null);
    setError(null);
    setLoading(true);
    cancelledRef.current = false;

    // If no URL provided, don't load anything
    if (!audioUrl) {
      setLoading(false);
      return;
    }

    // Load audio buffer using the queued request system
    loadAudioBuffer(audioContext, audioUrl)
      .then((buffer) => {
        if (!cancelledRef.current) {
          setAudioBuffer(buffer);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : String(err));
          setAudioBuffer(null);
          setLoading(false);
        }
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [audioContext, audioUrl]);

  return { audioBuffer, loading, error };
}

