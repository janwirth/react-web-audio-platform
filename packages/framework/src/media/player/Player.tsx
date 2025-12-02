import React, { useRef, ReactNode } from "react";
import { atom, useAtom } from "jotai";
import { atomFamily } from "jotai/utils";
import { DualViewListItem } from "../../components/DualViewList";
import { PlayerContext } from "./context/PlayerContext";
import { useMediaSession } from "./hooks/useMediaSession";
import { useQueueNavigation } from "./hooks/useQueueNavigation";
import { useQueueAutoPlay } from "./hooks/useQueueAutoPlay";
import { useTrackEnded } from "./hooks/useTrackEnded";
import { usePlayerHotkeys } from "./hooks/usePlayerHotkeys";

// Atom for tracking the currently active URL
export const activeUrlAtom = atom<string | null>(null);

// Atom family for playhead position per URL
export const playheadPositionAtomFamily = atomFamily((url: string) =>
  atom<number | null>(null)
);

// Queue state atoms
export type QueueItem = DualViewListItem;

export const queueAtom = atom<QueueItem[]>([]);
export const currentQueueIndexAtom = atom<number>(-1);

interface PlayerProps {
  children: ReactNode;
}

const PlayerInternal: React.FC<{
  audioRef: React.RefObject<HTMLAudioElement | null>;
}> = ({ audioRef }) => {
  const [queue] = useAtom(queueAtom);
  const [currentQueueIndex] = useAtom(currentQueueIndexAtom);
  const [activeUrl] = useAtom(activeUrlAtom);

  const { goToNext, goToPrevious } = useQueueNavigation();

  const currentItem =
    currentQueueIndex >= 0 && currentQueueIndex < queue.length
      ? queue[currentQueueIndex]
      : null;

  useQueueAutoPlay();
  useTrackEnded();

  useMediaSession({
    audioRef,
    currentItem,
    activeUrl,
    onPlay: () => {
      audioRef.current?.play().catch(console.error);
    },
    onPause: () => {
      audioRef.current?.pause();
    },
    onPrevious: () => goToPrevious(audioRef),
    onNext: () => goToNext(audioRef),
  });

  usePlayerHotkeys();

  return null;
};

export const Player: React.FC<PlayerProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <PlayerContext.Provider value={{ audioRef }}>
      <PlayerInternal audioRef={audioRef} />
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </PlayerContext.Provider>
  );
};

// Re-export hooks for convenience
export { useTrack } from "./hooks/useTrack";
export { usePlayer } from "./hooks/usePlayer";
export { useCurrentPlayback } from "./hooks/useCurrentPlayback";
export { usePlayerContext } from "./context/PlayerContext";
