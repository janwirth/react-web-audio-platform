import { useEffect, useState, useCallback, useMemo } from "react";
import { type QueueItem } from "@/components/player/Player";

export interface AudioItemData {
  title: string;
  audioUrl: string;
}

const API_URL = "http://localhost:3001/api/audio-items";
const BASE_URL = "http://localhost:3001";

export function useAudioItems() {
  const [audioItems, setAudioItems] = useState<AudioItemData[]>([]);

  useEffect(() => {
    const fetchAudioItems = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setAudioItems(data);
      } catch (err) {
        console.error("Failed to fetch audio items:", err);
      }
    };

    fetchAudioItems();
  }, []);

  // Convert audioItems to QueueItem format
  const allQueueItems = useMemo<QueueItem[]>(() => {
    return audioItems.map((item) => ({
      title: item.title,
      audioUrl: `${BASE_URL}${item.audioUrl}`,
    }));
  }, [audioItems]);

  const handleCreateQueue = useCallback(
    (
      startIndex: number,
      initQueue: (items: QueueItem[]) => void,
      onQueueCreated: (firstTrackUrl: string) => void
    ) => {
      // Create queue starting from the clicked track, including all subsequent tracks
      const queueItems: QueueItem[] = audioItems
        .slice(startIndex)
        .map((item) => ({
          title: item.title,
          audioUrl: `${BASE_URL}${item.audioUrl}`, // Store full URL
        }));

      initQueue(queueItems);

      // Start playing the first track in the queue at position 0
      if (queueItems.length > 0) {
        const firstTrackUrl = queueItems[0].audioUrl;
        onQueueCreated(firstTrackUrl);
      }
    },
    [audioItems]
  );

  return {
    audioItems,
    allQueueItems,
    handleCreateQueue,
    baseUrl: BASE_URL,
  };
}

