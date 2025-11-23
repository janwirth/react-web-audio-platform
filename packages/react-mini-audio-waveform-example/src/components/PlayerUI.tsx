import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePlayerContext, useTrack, activeUrlAtom } from "./Player";
import { useAtomValue } from "jotai";

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

interface HorizontalSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

function HorizontalSlider({
  value,
  min,
  max,
  onChange,
  className = "",
}: HorizontalSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = clickX / rect.width;
      let newValue = min + (max - min) * percentage;
      newValue = Math.max(min, Math.min(max, newValue));
      onChangeRef.current(newValue);
    },
    [min, max]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        updateValue(e.clientX);
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateValue]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className={`relative h-2 cursor-pointer select-none ${className}`}
      onMouseDown={(e) => {
        isDraggingRef.current = true;
        updateValue(e.clientX);
      }}
      onClick={(e) => {
        if (!isDraggingRef.current) {
          updateValue(e.clientX);
        }
      }}
    >
      <div
        className="absolute h-full w-full opacity-20"
        style={{ backgroundColor: "currentColor" }}
      />
      <div
        className="absolute h-full opacity-60"
        style={{ width: `${percentage}%`, backgroundColor: "currentColor" }}
      />
    </div>
  );
}

export function PlayerUI() {
  const { audioRef } = usePlayerContext();
  const activeUrl = useAtomValue(activeUrlAtom);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get seekAndPlay from useTrack - always call hook unconditionally
  // Use empty string as fallback if no active URL
  const trackHook = useTrack(activeUrl || "");

  // Update current time and playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
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
  }, [audioRef, isSeeking]);

  const handleProgressChange = useCallback(
    (value: number) => {
      if (!activeUrl || !duration) return;

      setIsSeeking(true);
      const percentage = value / 100; // Convert 0-100 to 0-1
      setCurrentTime(percentage * duration);

      // Use seekAndPlay instead of directly setting currentTime
      trackHook.seekAndPlay(percentage);

      // Reset seeking flag after a short delay
      setTimeout(() => {
        setIsSeeking(false);
      }, 100);
    },
    [activeUrl, trackHook, duration]
  );

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

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="flex items-center justify-center  text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-200 p-1"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 ml-0.5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Progress Scrubber */}
      <span className="text-xs font-mono text-gray-600  text-right font-black ">
        {formatTime(currentTime)}
      </span>
      <div className="flex-1">
        <HorizontalSlider
          value={progressPercentage}
          min={0}
          max={100}
          onChange={handleProgressChange}
          className="h-3"
        />
      </div>
      <span className="text-xs font-mono text-gray-600 ">
        {formatTime(duration)}
      </span>

      {/* Volume Control */}
      {/* <span className="text-xs font-mono text-gray-600 min-w-[60px]">
        Volume:
      </span> */}
      <div className="w-[100px]">
        <HorizontalSlider
          value={volume * 100}
          min={0}
          max={100}
          onChange={(value) => handleVolumeChange(value / 100)}
        />
      </div>
      {/* <span className="text-xs font-mono text-gray-600 min-w-[40px]">
        {Math.round(volume * 100)}%
      </span> */}
    </div>
  );
}
