import { useRef, useCallback, useEffect } from "react";

interface ScrollbarProps {
  orientation: "vertical" | "horizontal";
  scrollOffset: number;
  totalSize: number;
  containerSize: number;
  onScroll: (offset: number) => void;
  scrollbarSize?: number;
  rightOffset?: number;
}

export function Scrollbar({
  orientation,
  scrollOffset,
  totalSize,
  containerSize,
  onScroll,
  scrollbarSize = 12,
  rightOffset = 0,
}: ScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const isVertical = orientation === "vertical";
  const scrollableSize = Math.max(0, totalSize - containerSize);
  const thumbSize =
    containerSize > 0 && totalSize > 0
      ? Math.max(20, (containerSize / totalSize) * containerSize)
      : containerSize;
  const thumbPosition =
    scrollableSize > 0
      ? (scrollOffset / scrollableSize) * (containerSize - thumbSize)
      : 0;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      dragStartRef.current = isVertical ? e.clientY : e.clientX;
      dragStartOffsetRef.current = scrollOffset;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [scrollOffset, isVertical]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackSize = isVertical ? trackRect.height : trackRect.width;
      const mousePos = isVertical ? e.clientY : e.clientX;
      const trackStart = isVertical ? trackRect.top : trackRect.left;

      const relativePos = mousePos - trackStart - thumbSize / 2;
      const newThumbPosition = Math.max(
        0,
        Math.min(trackSize - thumbSize, relativePos)
      );
      const newScrollOffset =
        scrollableSize > 0
          ? (newThumbPosition / (trackSize - thumbSize)) * scrollableSize
          : 0;

      onScroll(newScrollOffset);
    },
    [isVertical, thumbSize, scrollableSize, onScroll]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current || thumbRef.current?.contains(e.target as Node))
        return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackSize = isVertical ? trackRect.height : trackRect.width;
      const clickPos = isVertical ? e.clientY : e.clientX;
      const trackStart = isVertical ? trackRect.top : trackRect.left;

      const relativePos = clickPos - trackStart - thumbSize / 2;
      const newThumbPosition = Math.max(
        0,
        Math.min(trackSize - thumbSize, relativePos)
      );
      const newScrollOffset =
        scrollableSize > 0
          ? (newThumbPosition / (trackSize - thumbSize)) * scrollableSize
          : 0;

      onScroll(newScrollOffset);
    },
    [isVertical, thumbSize, scrollableSize, onScroll]
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (scrollableSize <= 0) return null;

  return (
    <div
      ref={trackRef}
      className={`absolute bg-black/10 dark:bg-white/10 ${
        isVertical ? "top-0 bottom-0 w-[12px]" : "bottom-0 left-0 h-[12px]"
      } cursor-pointer`}
      onClick={handleTrackClick}
      style={{
        [isVertical ? "width" : "height"]: `${scrollbarSize}px`,
        right: `${rightOffset}px`,
      }}
    >
      <div
        ref={thumbRef}
        className={`absolute bg-black/30 dark:bg-white/30 hover:bg-black/50 dark:hover:bg-white/50 transition-opacity ${
          isVertical ? "w-full" : "h-full"
        } cursor-grab active:cursor-grabbing`}
        style={{
          [isVertical ? "top" : "left"]: `${thumbPosition}px`,
          [isVertical ? "height" : "width"]: `${thumbSize}px`,
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

