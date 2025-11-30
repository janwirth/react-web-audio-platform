import { useEffect, useRef, useState, useMemo } from "react";
import PQueue from "p-queue";

// Queue manager: maintains queues by ID
const queues = new Map<string, PQueue>();

export function getQueue(queueId?: string): PQueue {
  const id = queueId || "default";
  
  if (!queues.has(id)) {
    console.log(`[Queue] ✓ Creating new queue: "${id}"`);
    const queue = new PQueue({ concurrency: 1 });
    
    // Track task count for better logging
    let taskCounter = 0;
    
    // Add event listeners for queue state changes
    queue.on("active", () => {
      // Read state in next tick after queue updates
      Promise.resolve().then(() => {
        console.log(`[Queue:${id}] ▶ Task #${taskCounter} started executing. Pending: ${queue.pending}, Remaining in queue: ${queue.size}`);
      });
    });
    
    queue.on("idle", () => {
      console.log(`[Queue:${id}] ✓ Queue is idle. All tasks completed.`);
    });
    
    queue.on("add", () => {
      taskCounter++;
      // Read state in next tick after queue updates
      Promise.resolve().then(() => {
        console.log(`[Queue:${id}] ➕ Task #${taskCounter} queued. Total pending: ${queue.pending}, Total queued: ${queue.size}`);
      });
    });
    
    queue.on("next", () => {
      // Read state in next tick after queue updates
      Promise.resolve().then(() => {
        console.log(`[Queue:${id}] ✓ Task completed. Pending: ${queue.pending}, Remaining in queue: ${queue.size}`);
      });
    });
    
    queues.set(id, queue);
  }
  
  return queues.get(id)!;
}

// Shared default queue instance for backward compatibility
export const defaultQueue: PQueue = getQueue("default");
// Export as 'queue' for backward compatibility
export const queue: PQueue = defaultQueue;

type LoadingStatus = {
  type: "loading";
};

type SuccessStatus<T> = {
  type: "success";
  data: T;
};

type ErrorStatus = {
  type: "error";
  error: Error;
};

type Status<T> = LoadingStatus | SuccessStatus<T> | ErrorStatus;

export function useQueuedTask<T>(
  task: () => Promise<T>,
  options?: { queueId?: string }
): Status<T> {
  const [status, setStatus] = useState<Status<T>>({ type: "loading" });
  const abortControllerRef = useRef<AbortController | null>(null);
  const queuedTaskRef = useRef<(() => Promise<T>) | null>(null);

  // Get the queue for the given queueId
  const queue = useMemo(() => {
    return getQueue(options?.queueId);
  }, [options?.queueId]);

  useEffect(() => {
    // Create new AbortController for this task
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Add task to queue with proper typing
    const queuedTask = async (): Promise<T> => {
      // Check if already aborted
      if (abortController.signal.aborted) {
        throw new Error("Task was aborted");
      }

      try {
        // Add abort signal listener to reject the task if aborted during execution
        const abortPromise = new Promise<never>((_, reject) => {
          abortController.signal.addEventListener("abort", () => {
            reject(new Error("Task was aborted"));
          });
        });

        // Race between the task and abort signal
        return await Promise.race([task(), abortPromise]);
      } finally {
        // Remove our reference to the queued task
        queuedTaskRef.current = null;
      }
    };

    // Store reference to the queued task
    queuedTaskRef.current = queuedTask;

    queue
      .add(queuedTask)
      .then((result) => {
        // Check if aborted during execution
        if (abortController.signal.aborted) return;
        if (result) {
          setStatus({ type: "success", data: result });
        }
      })
      .catch((error) => {
        // Check if aborted
        if (abortController.signal.aborted) return;
        setStatus({
          type: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    // Cleanup function to abort task if component unmounts
    return () => {
      abortController.abort();
      // The task will be automatically removed from the queue when it rejects
    };
  }, [task, queue]); // Re-run effect if task or queue changes

  return status;
}

