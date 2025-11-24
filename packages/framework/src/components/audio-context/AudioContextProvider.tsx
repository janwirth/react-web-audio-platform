import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
  useRef,
} from "react";
import { getQueue } from "./useQueuedTask";

interface AudioContextValue {
  audioContext: AudioContext;
  audioElement: HTMLAudioElement;
}

const AudioContextContext = createContext<AudioContextValue | null>(null);

export const AudioContextProvider = ({ children }: { children: ReactNode }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    // Create audio element
    const audioElement = document.createElement("audio");
    audioElement.style.display = "none";
    document.body.appendChild(audioElement);
    audioElementRef.current = audioElement;

    // Create AudioContext from the audio element's media element source
    const ctx = new AudioContext();

    // Connect audio element to AudioContext
    const source = ctx.createMediaElementSource(audioElement);
    source.connect(ctx.destination);
    sourceNodeRef.current = source; // Keep reference to prevent garbage collection

    setAudioContext(ctx);

    // Cleanup on unmount
    return () => {
      sourceNodeRef.current = null;
      ctx.close();
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
      }
      audioElementRef.current = null;
      setAudioContext(null);
    };
  }, []);

  if (!audioContext || !audioElementRef.current) {
    return null;
  }

  return (
    <AudioContextContext.Provider
      value={{
        audioContext,
        audioElement: audioElementRef.current,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error(
      "useAudioContext must be used within an AudioContextProvider"
    );
  }
  return context.audioContext;
};

export const useElement = () => {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error("useElement must be used within an AudioContextProvider");
  }
  return context.audioElement;
};

/**
 * Queue an audio task for execution. Tasks are executed sequentially
 * to prevent browser overload from multiple simultaneous audio operations.
 *
 * @param audioContext - The AudioContext to use for the task
 * @param task - A function that takes AudioContext and returns a Promise
 * @returns A Promise that resolves with the task result
 */
export function queueAudioTask<T>(
  audioContext: AudioContext,
  task: (audioContext: AudioContext) => Promise<T>
): Promise<T> {
  const queue = getQueue("audio-context");
  const taskId = `task-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  console.log(
    `[AudioQueue] Queuing task: ${taskId}. Queue size: ${queue.size}, Pending: ${queue.pending}`
  );

  const startTime = performance.now();

  return queue.add(async (): Promise<T> => {
    console.log(`[AudioQueue] Starting task: ${taskId}`);

    if (!audioContext) {
      const error = new Error("AudioContext is not available");
      console.error(`[AudioQueue] Task ${taskId} failed:`, error);
      throw error;
    }

    try {
      const result = await task(audioContext);
      const duration = performance.now() - startTime;
      console.log(
        `[AudioQueue] Task ${taskId} completed successfully in ${duration.toFixed(
          2
        )}ms`
      );
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[AudioQueue] Task ${taskId} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  }) as Promise<T>;
}
