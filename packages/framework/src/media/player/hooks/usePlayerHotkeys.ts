import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { usePlayerContext } from "../context/PlayerContext";
import { activeUrlAtom } from "../Player";
import {
  useHotkeys,
  createHotkeyBinding,
} from "../../../layout-and-control/hooks/useHotkeys";

/**
 * Hook for handling player keyboard shortcuts (space for play/pause)
 */
export const usePlayerHotkeys = () => {
  const { audioRef } = usePlayerContext();
  const activeUrl = useAtomValue(activeUrlAtom);

  const handleSpaceKey = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeUrl) return;

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [audioRef, activeUrl]);

  const spaceKeyBindings = useMemo(
    () => [createHotkeyBinding("space", handleSpaceKey, "Play / Pause")],
    [handleSpaceKey]
  );

  useHotkeys(spaceKeyBindings, {
    preventDefault: true,
    enableOnFormTags: false,
  });
};

