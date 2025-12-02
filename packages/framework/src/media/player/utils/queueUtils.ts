import { normalizeUrl } from "./urlUtils";
import type { QueueItem } from "../Player";

/**
 * Find the index of a track in a list of items by URL
 */
export const findTrackIndex = (
  items: QueueItem[],
  url: string
): number => {
  const normalizedUrl = normalizeUrl(url);
  return items.findIndex((item) => {
    const normalizedItemUrl = normalizeUrl(item.audioUrl);
    return normalizedItemUrl === normalizedUrl;
  });
};

/**
 * Build a queue starting from a specific track
 */
export const buildQueueFromTrack = (
  allItems: QueueItem[],
  url: string
): QueueItem[] | null => {
  if (allItems.length === 0) return null;

  const currentIndex = findTrackIndex(allItems, url);
  if (currentIndex < 0) return null;

  return allItems.slice(currentIndex);
};

