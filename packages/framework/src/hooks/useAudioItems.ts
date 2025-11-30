import { useEffect, useState, useCallback, useMemo } from "react";
import { type QueueItem } from "@/media/player/Player";
import z from "zod";

const TrackApiSchema = z.object({
  id: z.string(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  title: z.string(),
  rating: z.number().nullable(),
  bpm: z.number().nullable(),
  media: z.object({
    audio: z.object({
      md5: z.string(),
      path: z.string(),
    }),
    cover: z
      .object({
        md5: z.string(),
        path: z.string(),
      })
      .nullable(),
  }),
});

const AudioItemDataSchema = z.object({
  title: z.string(),
  audioUrl: z.string(),
  id: z.string(),
  coverUrl: z.string().nullable(),
});
type AudioItemData = z.infer<typeof AudioItemDataSchema>;

const API_URL = "http://192.168.178.48:3000/tracks";
const BASE_URL = "http://192.168.178.48:3000";

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
        const parsedTracks = TrackApiSchema.array().parse(data);

        // Transform API data to AudioItemData format
        const transformedItems: AudioItemData[] = parsedTracks
          .filter((track) => track.deletedAt === null) // Filter out deleted tracks
          .map((track) => ({
            id: track.id,
            title: track.title,
            audioUrl: `${BASE_URL}/track/${track.id}/media/audio`,
            coverUrl: `${BASE_URL}/track/${track.id}/media/cover`,
          }));

        console.log("parsedData", transformedItems);
        setAudioItems(transformedItems);
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
      audioUrl: item.audioUrl,
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
          audioUrl: item.audioUrl, // Already full URL
          id: item.id,
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
