import { useState, useEffect, useCallback } from "react";
import { useAtomValue, useAtom, useSetAtom } from "jotai";
import {
  usePlayerContext,
  useCurrentPlayback,
  queueAtom,
  currentQueueIndexAtom,
  activeUrlAtom,
} from "./Player";
import { MiniSpectro } from "../visualizer/MiniSpectro";
import { Row } from "../Row";
import { NextIcon, PreviousIcon } from "./Icons";
import { WaveformWithPlayhead } from "../waveform";
import { useColorPalette } from "../Tracklist";
import { HorizontalSlider } from "../inputs/HorizontalSlider";

// Format seconds to MM:SS or HH:MM:SS
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export function PlayerUI() {
  const { audioRef } = usePlayerContext();
  const playback = useCurrentPlayback();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update current time and playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const updatePlayingState = () => {
      setIsPlaying(!audio.paused);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", updatePlayingState);
    audio.addEventListener("pause", updatePlayingState);
    audio.addEventListener("ended", updatePlayingState);

    // Initialize volume and playing state
    setVolume(audio.volume);
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", updatePlayingState);
      audio.removeEventListener("pause", updatePlayingState);
      audio.removeEventListener("ended", updatePlayingState);
    };
  }, [audioRef]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.volume = value;
      setVolume(value);
    },
    [audioRef]
  );

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [audioRef]);

  const remainingTime = duration > 0 ? duration - currentTime : 0;
  return (
    <Row className="items-center gap-5 px-2">
      <Controls
        isPlaying={isPlaying}
        handlePlayPause={handlePlayPause}
        audioRef={audioRef}
      />
      <CurrentTrackInfo />
      <Duration
        currentTime={currentTime}
        duration={duration}
        remainingTime={remainingTime}
        playback={playback}
      />
      {/* Play/Pause Button */}
      <div className="w-[100px]">
        <HorizontalSlider
          value={volume * 100}
          min={0}
          max={100}
          onChange={(value) => handleVolumeChange(value / 100)}
        />
      </div>
      {playback && (
        <>
          {/* Progress Scrubber */}
          <MiniSpectro size={16} />
        </>
      )}
    </Row>
  );
}
const CurrentTrackInfo = () => {
  const queue = useAtomValue(queueAtom);
  const currentQueueIndex = useAtomValue(currentQueueIndexAtom);
  const currentTrack =
    currentQueueIndex >= 0 && currentQueueIndex < queue.length
      ? queue[currentQueueIndex]
      : null;

  if (!currentTrack) return null;

  return (
    <>
      {/* Track Cover */}
      {currentTrack.coverUrl ? (
        <div className="w-8 h-8 shrink-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title || currentTrack.name || "Track cover"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 shrink-0 bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400" />
      )}

      {/* Track Title */}
      <span className="text-xs font-mono text-black dark:text-white font-medium shrink-0 truncate w-80">
        {currentTrack.title || currentTrack.name || "Unknown Track"}
      </span>
    </>
  );
};

const Duration = ({
  currentTime,
  duration,
  remainingTime,
  playback,
}: {
  currentTime: number;
  duration: number;
  remainingTime: number;
  playback: ReturnType<typeof useCurrentPlayback>;
}) => {
  const colorPalette = useColorPalette();

  return (
    <Row className="flex flex-1 w-full items-center gap-2">
      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 text-right font-black">
        {duration > 0 ? formatTime(currentTime) : "-:--"}
      </span>
      <div className="w-100">
        {playback?.url ? (
          <WaveformWithPlayhead
            url={playback.url}
            colorPalette={colorPalette}
            height={8}
          />
        ) : (
          <div className="h-1 bg-gray-500 w-full"></div>
        )}
      </div>
      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
        {duration > 0 ? formatTime(remainingTime) : "-:--"}
      </span>
    </Row>
  );
};

const Controls = ({
  isPlaying,
  handlePlayPause,
  audioRef,
}: {
  isPlaying: boolean;
  handlePlayPause: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) => {
  const [queue] = useAtom(queueAtom);
  const [currentIndex, setCurrentQueueIndex] = useAtom(currentQueueIndexAtom);
  const setActiveUrl = useSetAtom(activeUrlAtom);

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextItem = queue[nextIndex];
      if (nextItem?.audioUrl && audioRef.current) {
        setCurrentQueueIndex(nextIndex);
        setActiveUrl(nextItem.audioUrl);
        audioRef.current.src = nextItem.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, queue, audioRef, setCurrentQueueIndex, setActiveUrl]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevItem = queue[prevIndex];
      if (prevItem?.audioUrl && audioRef.current) {
        setCurrentQueueIndex(prevIndex);
        setActiveUrl(prevItem.audioUrl);
        audioRef.current.src = prevItem.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, queue, audioRef, setCurrentQueueIndex, setActiveUrl]);

  const canGoNext = currentIndex < queue.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <>
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all cursor-pointer disabled:cursor-not-allowed h-full aspect-square hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Previous track"
        style={{ opacity: canGoPrev ? 1 : 0.5 }}
      >
        <PreviousIcon className="w-4 h-4" />
      </button>
      <button
        onClick={handlePlayPause}
        className="flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 p-1 w-7 h-7 -mx-2"
        aria-label={isPlaying ? "Pause" : "Play"}
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
      </button>
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className="flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all cursor-pointer disabled:cursor-not-allowed h-full aspect-square hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Next track"
        style={{ opacity: canGoNext ? 1 : 0.5 }}
      >
        <NextIcon className="w-4 h-4" />
      </button>
    </>
  );
};
