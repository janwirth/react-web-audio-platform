import { useAtomValue } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import {
  activeUrlAtom,
  playheadPositionAtomFamily,
} from "../Player";
import { usePlaybackState } from "./usePlaybackState";
import { useSeek } from "./useSeek";

export const useCurrentPlayback = (): null | {
  url: string;
  playheadposition: number | null;
  playing: boolean;
  seekTo: (position: number) => void;
} => {
  const { audioRef } = usePlayerContext();
  const activeUrl = useAtomValue(activeUrlAtom);
  const playing = usePlaybackState(audioRef);
  const seekTo = useSeek(audioRef, activeUrl);

  const playheadPosition = useAtomValue(
    playheadPositionAtomFamily(activeUrl || "")
  );

  if (!activeUrl) {
    return null;
  }

  return {
    url: activeUrl,
    playheadposition: playheadPosition,
    playing,
    seekTo,
  };
};

