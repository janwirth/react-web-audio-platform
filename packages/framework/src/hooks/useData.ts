import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import z from "zod";

const BASE_URL = "http://192.168.178.48:3000";

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

// Schema for tracks returned by /tracks/by_tag/:tag endpoint
const TrackByTagApiSchema = z.object({
  track: z.object({
    id: z.string(),
    title: z.string(),
    rating: z.number().nullable(),
    created_on: z.string(),
    tags: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          emoji: z.string().nullable(),
        })
      )
      .optional(),
    fishbone_source: z
      .object({
        id: z.string(),
        url: z.string(),
        fishbone_local_track_mirror: z
          .object({
            audio: z.object({
              md5: z.string(),
              ext: z.string(),
            }),
            cover: z
              .object({
                md5: z.string(),
                ext: z.string(),
              })
              .nullable(),
          })
          .nullable(),
      })
      .nullable(),
    fishbone_local_track_mirror: z
      .array(
        z.object({
          audio: z.object({
            md5: z.string(),
            ext: z.string(),
          }),
          cover: z
            .object({
              md5: z.string(),
              ext: z.string(),
            })
            .nullable(),
        })
      )
      .optional(),
  }),
  audio: z.object({
    path: z.string(),
    md5: z.string(),
  }),
  cover: z
    .object({
      md5: z.string(),
      path: z.string(),
    })
    .nullable(),
});

const TracksByTagResponseSchema = z.object({
  tracks: TrackByTagApiSchema.array(),
  status: z.number().optional(),
});

export interface Track {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
}

export interface Tag {
  id: string;
  name: string;
  emoji: string | null;
}

// Atoms for global state
export const tagsAtom = atom<Tag[]>([]);
export const activeTagAtom = atom<string | null>(null);
export const tracksAtom = atom<Track[]>([]);
export const loadingAtom = atom<boolean>(true);
export const errorAtom = atom<string | null>(null);

export function useData() {
  const [tags, setTags] = useAtom(tagsAtom);
  const [activeTag, setActiveTag] = useAtom(activeTagAtom);
  const [tracks, setTracks] = useAtom(tracksAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);

  // Fetch tags - try /tags endpoint first, fallback to extracting from /tracks
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);

        // Try to fetch tags from a /tag endpoint first
        let tagsList: Tag[] = [];
        try {
          const tagsResponse = await fetch(`${BASE_URL}/tag`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            // Tag endpoint returns an array of tag objects with {id, name, emoji}
            if (Array.isArray(tagsData)) {
              tagsList = tagsData.map((tag: any) => ({
                id: tag.id || tag.name,
                name: tag.name,
                emoji: tag.emoji || null,
              }));
            } else if (tagsData.tags && Array.isArray(tagsData.tags)) {
              tagsList = tagsData.tags.map((tag: any) => ({
                id: tag.id || tag.name,
                name: tag.name,
                emoji: tag.emoji || null,
              }));
            }
          }
        } catch {
          // /tag endpoint doesn't exist or returns invalid JSON, continue to fallback
        }

        // Fallback: fetch tracks and extract tags if /tag endpoint doesn't exist
        if (tagsList.length === 0) {
          const response = await fetch(`${BASE_URL}/tracks`);
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          const data = await response.json();
          const parsedTracks = TrackApiSchema.array().parse(data);

          // Extract unique tags from tracks if they have a tags field
          // For now, if tracks don't have tags, create a default "all" tag
          const trackTags = parsedTracks
            .filter((track) => track.deletedAt === null)
            .flatMap((track) => {
              // If tracks have tags field, extract them
              // Otherwise, return a default tag
              return (track as any).tags || ["all"];
            });

          tagsList = Array.from(new Set(trackTags)).map((tagName) => ({
            id: String(tagName),
            name: String(tagName),
            emoji: null,
          }));
        }

        // Ensure we have at least one tag
        if (tagsList.length === 0) {
          tagsList = [{ id: "all", name: "all", emoji: null }];
        }

        setTags(tagsList);
        setActiveTag(tagsList[0].name);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tags");
        // Fallback to default tag
        const defaultTags: Tag[] = [{ id: "all", name: "all", emoji: null }];
        setTags(defaultTags);
        setActiveTag(defaultTags[0].name);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Fetch tracks by tag when activeTag changes
  useEffect(() => {
    if (!activeTag) return;

    const fetchTracksByTag = async () => {
      try {
        setLoading(true);
        const encodedTag = encodeURIComponent(activeTag);
        const response = await fetch(`${BASE_URL}/tracks/by_tag/${encodedTag}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        const parsedResponse = TracksByTagResponseSchema.parse(data);

        // Transform API data to Track format
        const transformedTracks: Track[] = parsedResponse.tracks.map((item) => {
          const track = item.track;
          // Get cover from item.cover (direct) or fishbone_local_track_mirror or fishbone_source
          let coverMd5: string | null = item.cover?.md5 || null;
          if (!coverMd5) {
            if (
              track.fishbone_local_track_mirror &&
              track.fishbone_local_track_mirror.length > 0
            ) {
              coverMd5 =
                track.fishbone_local_track_mirror[0].cover?.md5 || null;
            } else if (
              track.fishbone_source?.fishbone_local_track_mirror?.cover
            ) {
              coverMd5 =
                track.fishbone_source.fishbone_local_track_mirror.cover.md5;
            }
          }

          return {
            id: track.id,
            title: track.title,
            audioUrl: `${BASE_URL}/track/${track.id}/media/audio`,
            coverUrl: coverMd5
              ? `${BASE_URL}/track/${track.id}/media/cover`
              : null,
          };
        });

        setTracks(transformedTracks);
      } catch (err) {
        console.error("Failed to fetch tracks by tag:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tracks");
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTracksByTag();
  }, [activeTag]);

  return {
    tags,
    activeTag,
    setActiveTag,
    tracks,
    loading,
    error,
  };
}
