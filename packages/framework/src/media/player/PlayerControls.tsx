import { useCallback } from "react";
import { useAtom } from "jotai";
import { queueAtom, currentQueueIndexAtom } from "./Player";
import { useQueueNavigation } from "./hooks/useQueueNavigation";
import { NextIcon, PreviousIcon } from "./Icons";
import { Row } from "../../ui/Row";

const ControlButton = ({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-6 flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all cursor-pointer disabled:cursor-not-allowed aspect-square hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label={ariaLabel}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
};

export const PlayerControls = ({
  isPlaying,
  handlePlayPause,
  audioRef,
}: {
  isPlaying: boolean;
  handlePlayPause: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) => {
  const [queue] = useAtom(queueAtom);
  const [currentIndex] = useAtom(currentQueueIndexAtom);
  const { goToNext, goToPrevious } = useQueueNavigation();

  const handleNext = useCallback(() => {
    goToNext(audioRef);
  }, [goToNext, audioRef]);

  const handlePrev = useCallback(() => {
    goToPrevious(audioRef);
  }, [goToPrevious, audioRef]);

  const canGoNext = currentIndex < queue.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <Row className="gap-1 w-min grow-0">
      <ControlButton
        onClick={handlePrev}
        disabled={!canGoPrev}
        ariaLabel="Previous track"
      >
        <PreviousIcon className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        onClick={handlePlayPause}
        // aria-label={isPlaying ? "Pause" : "Play"}
        disabled={false}
        ariaLabel={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4.5 h-4.5"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </ControlButton>
      <ControlButton
        onClick={handleNext}
        disabled={!canGoNext}
        ariaLabel="Next track"
      >
        <NextIcon className="w-4 h-4" />
      </ControlButton>
    </Row>
  );
};
