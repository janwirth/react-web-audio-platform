import { useRef, useEffect } from "react";

type Polarity = "normal" | "offset";

interface VerticalSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  polarity?: Polarity;
  onChange: (value: number) => void;
}

export function VerticalSlider({
  label,
  value,
  min,
  max,
  step,
  polarity = "normal",
  onChange,
}: VerticalSliderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const polarityRef = useRef(polarity);
  const rafRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    onChangeRef.current = onChange;
    minRef.current = min;
    maxRef.current = max;
    stepRef.current = step;
    polarityRef.current = polarity;
  }, [onChange, min, max, step, polarity]);

  const barHeight = 64;
  const borderRadius = 2; // rounded-sm = 0.125rem = 2px

  let fillHeight: number;
  let fillBottom: string;
  let fillTop: string;
  let isAboveCenter: boolean;
  let shouldRoundTop: boolean;
  let shouldRoundBottom: boolean;

  if (polarity === "normal") {
    // Normal: fill from bottom to value position
    const fillPercentage = ((value - min) / (max - min)) * 100;
    fillHeight = (fillPercentage / 100) * barHeight;
    fillBottom = "0px";
    fillTop = "auto";
    isAboveCenter = false;
    shouldRoundTop = fillHeight >= barHeight - borderRadius;
    shouldRoundBottom = false;
  } else {
    // Offset: deviation from center (midpoint between min and max)
    const center = (min + max) / 2;
    const deviation = Math.abs(value - center);
    const maxDeviation = Math.max(center - min, max - center);
    const fillPercentage = (deviation / maxDeviation) * 100;
    const maxFillHeight = barHeight * 0.5;

    fillHeight = Math.min(
      (fillPercentage / 100) * maxFillHeight,
      maxFillHeight
    );
    isAboveCenter = value > center;
    fillBottom = isAboveCenter ? "auto" : `${barHeight / 2 - fillHeight}px`;
    fillTop = isAboveCenter ? `${barHeight / 2 - fillHeight}px` : "auto";
    shouldRoundTop =
      isAboveCenter && fillHeight >= maxFillHeight - borderRadius;
    shouldRoundBottom =
      !isAboveCenter && fillHeight >= maxFillHeight - borderRadius;
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !barRef.current) return;

      // Cancel any pending animation frame
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use requestAnimationFrame to throttle updates
      rafRef.current = requestAnimationFrame(() => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top;

        const percentage = 1 - clickY / rect.height;
        let newValue =
          minRef.current + (maxRef.current - minRef.current) * percentage;
        newValue = Math.max(minRef.current, Math.min(maxRef.current, newValue));

        // Apply step if provided
        if (stepRef.current) {
          newValue = Math.round(newValue / stepRef.current) * stepRef.current;
        }

        onChangeRef.current(newValue);
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
  }, []); // Empty deps - we use refs for all values

  const updateValue = (clientY: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickY = clientY - rect.top;
    const percentage = 1 - clickY / rect.height;
    let newValue =
      minRef.current + (maxRef.current - minRef.current) * percentage;
    newValue = Math.max(minRef.current, Math.min(maxRef.current, newValue));

    // Apply step if provided
    if (stepRef.current) {
      newValue = Math.round(newValue / stepRef.current) * stepRef.current;
    }

    onChangeRef.current(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className=" text-xs text-gray-300 font-mono font-bold rotate-90 mb-2 w-1 scale-75">
          {label}
        </span>
      )}
      <div
        ref={barRef}
        className="relative w-2.5 bg-gray-300 rounded-sm cursor-pointer select-none overflow-hidden"
        style={{ height: `${barHeight}px` }}
        onMouseDown={(e) => {
          isDraggingRef.current = true;
          updateValue(e.clientY);
        }}
        onClick={(e) => {
          updateValue(e.clientY);
        }}
      >
        {/* Fill */}
        <div
          className="absolute w-full bg-gray-500"
          style={{
            height: `${fillHeight}px`,
            bottom: fillBottom,
            top: fillTop,
            borderTopLeftRadius: shouldRoundTop ? `${borderRadius}px` : "0",
            borderTopRightRadius: shouldRoundTop ? `${borderRadius}px` : "0",
            borderBottomLeftRadius: shouldRoundBottom
              ? `${borderRadius}px`
              : "0",
            borderBottomRightRadius: shouldRoundBottom
              ? `${borderRadius}px`
              : "0",
          }}
        />
        {/* Center indicator - only show for offset */}
        {polarity === "offset" && (
          <div
            className="absolute w-full h-0.5 bg-gray-300 opacity-50"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
        )}
      </div>
    </div>
  );
}
