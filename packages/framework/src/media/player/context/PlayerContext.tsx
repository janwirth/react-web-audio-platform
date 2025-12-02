import { createContext, useContext, useRef } from "react";

interface PlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a Player component");
  }
  return context;
};

