import { createContext, useContext } from "react";

interface PlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setSrc: (url: string) => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a Player component");
  }
  return context;
};
