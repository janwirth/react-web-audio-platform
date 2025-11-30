import { useState, useEffect, useRef, useCallback } from "react";

interface HorizontalSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

export function HorizontalSlider({
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

