import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";
import { getQueue } from "../hooks/useQueuedTask";

const AudioContextContext = createContext<AudioContext>(
  null as unknown as AudioContext
);

export const AudioContextProvider = ({ children }: { children: ReactNode }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    const ctx = new AudioContext();
    setAudioContext(ctx);

    // Cleanup on unmount
    return () => {
      ctx.close();
      setAudioContext(null);
    };
  }, []);

  if (!audioContext) {
    return null;
  }

  return (
    <AudioContextContext.Provider value={audioContext}>
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
  return context;
};

export const useElement = () => {
  return useAudioContext();
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

  return queue.add(async () => {
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
  });
}
