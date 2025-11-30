import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import {
  usePlayerContext,
  useCurrentPlayback,
  queueAtom,
  currentQueueIndexAtom,
} from "./Player";
import { MiniSpectro } from "../visualizer/MiniSpectro";
import { Row } from "../../ui/Row";
import { WaveformWithPlayhead } from "../waveform";
import { PlayerControls } from "./PlayerControls";
import { useColorPalette } from "../../components/Tracklist";
import { HorizontalSlider } from "../../ui/inputs/HorizontalSlider";

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
      <PlayerControls
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
        <div className="w-6 h-6 shrink-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title || currentTrack.name || "Track cover"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-6 h-6 shrink-0 bg-gray-400 dark:bg-gray-600 border border-gray-800 dark:border-gray-400" />
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
  if (!playback?.url) return null;

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
          <></>
        )}
      </div>
      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
        {duration > 0 ? formatTime(remainingTime) : "-:--"}
      </span>
    </Row>
  );
};
