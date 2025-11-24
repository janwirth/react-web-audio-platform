import { useRef, useEffect, useState, useMemo } from "react";

interface CoverFlowItem {
  id: string;
  title?: string;
  imgSrc?: string | null;
}

interface CoverFlowV2Props {
  items?: CoverFlowItem[];
}

const defaultItems: CoverFlowItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Item ${i + 1}`,
  imgSrc:
    i % 2 === 0
      ? "https://i.scdn.co/image/ab67616d00001e02d9194aa18fa4c9362b47464f"
      : null,
}));

const ITEM_WIDTH = 128; // w-32 = 128px
const GAP = 16; // gap-4 = 16px
const ITEM_SIZE = ITEM_WIDTH + GAP;

export const CoverFlowV2 = ({ items = defaultItems }: CoverFlowV2Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const wheelAccumulatorRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [scrollAccumulation, setScrollAccumulation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate initial offset to center first element and track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerWidth = () => {
      const width = container.clientWidth;
      setContainerWidth(width);
    };

    const calculateInitialOffset = () => {
      const width = container.clientWidth;
      setContainerWidth(width);
      // Center first item: container center - item center
      const initialOffset = width / 2 - ITEM_WIDTH / 2;
      setOffsetX(initialOffset);
    };

    // Wait for next frame to ensure container has dimensions
    requestAnimationFrame(() => {
      requestAnimationFrame(calculateInitialOffset);
    });

    // Track container width changes
    const resizeObserver = new ResizeObserver(() => {
      updateContainerWidth();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate visible items based on offsetX and container width
  const visibleItems = useMemo(() => {
    if (containerWidth === 0) {
      return { firstIndex: 0, lastIndex: 0, count: 0, items: [] };
    }

    const containerLeft = 0;
    const containerRight = containerWidth;

    // Calculate the leftmost position of items container relative to viewport
    const itemsLeft = offsetX;
    const itemsRight = offsetX + items.length * ITEM_SIZE;

    // Find first visible item
    let firstIndex = 0;
    for (let i = 0; i < items.length; i++) {
      const itemLeft = itemsLeft + i * ITEM_SIZE;
      const itemRight = itemLeft + ITEM_WIDTH;
      if (itemRight >= containerLeft) {
        firstIndex = i;
        break;
      }
    }

    // Find last visible item
    let lastIndex = items.length - 1;
    for (let i = items.length - 1; i >= 0; i--) {
      const itemLeft = itemsLeft + i * ITEM_SIZE;
      const itemRight = itemLeft + ITEM_WIDTH;
      if (itemLeft <= containerRight) {
        lastIndex = i;
        break;
      }
    }

    const visibleIndices = [];
    for (let i = firstIndex; i <= lastIndex; i++) {
      visibleIndices.push(i);
    }

    return {
      firstIndex,
      lastIndex,
      count: Math.max(0, lastIndex - firstIndex + 1),
      items: visibleIndices.map((idx) => ({
        index: idx,
        item: items[idx],
      })),
    };
  }, [offsetX, items, containerWidth]);

  // Handle wheel events - accumulate for horizontal scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const updateOffset = () => {
      const pixelsToScroll = Math.floor(
        Math.abs(wheelAccumulatorRef.current) / 1
      );

      // Update debug accumulation display
      setScrollAccumulation(wheelAccumulatorRef.current);

      if (pixelsToScroll > 0) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        setOffsetX((prev) => {
          const newOffset = prev + pixelsToScroll * direction;
          // Calculate bounds: don't scroll past first or last item
          const minOffset = container.clientWidth / 2 - ITEM_WIDTH / 2;
          const maxOffset =
            container.clientWidth / 2 -
            ITEM_WIDTH / 2 -
            (items.length - 1) * ITEM_SIZE;
          return Math.max(maxOffset, Math.min(minOffset, newOffset));
        });
        // Keep remainder for next scroll
        wheelAccumulatorRef.current = wheelAccumulatorRef.current % 1;
        setScrollAccumulation(wheelAccumulatorRef.current);
      }
      rafId = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Accumulate horizontal wheel delta (inverted)
      wheelAccumulatorRef.current += -e.deltaX;
      setScrollAccumulation(wheelAccumulatorRef.current);

      // Use requestAnimationFrame for smooth updates
      if (rafId === null) {
        rafId = requestAnimationFrame(updateOffset);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden relative"
      style={{ height: "200px" }}
    >
      {/* Debug overlay */}
      <div className="absolute top-2 left-2 bg-black/80 dark:bg-white/80 text-white dark:text-black p-2 font-mono text-xs z-50 border border-white dark:border-black">
        <div>Scroll Accumulation: {scrollAccumulation.toFixed(2)}</div>
        <div>Offset X: {offsetX.toFixed(2)}px</div>
        <div>Visible Items: {visibleItems.count}</div>
        <div>Total Items: {items.length}</div>
        <div>
          Current Items: [{visibleItems.firstIndex}..{visibleItems.lastIndex}]
        </div>
        <div className="mt-1 text-[10px] opacity-70">
          {visibleItems.items.length > 0 && (
            <div>
              IDs: {visibleItems.items.map((v) => v.item.id).join(", ")}
            </div>
          )}
        </div>
      </div>

      <div
        ref={itemsContainerRef}
        className="flex gap-4 absolute"
        style={{
          transform: `translateX(${offsetX}px)`,
          left: 0,
          top: "50%",
          marginTop: `-${ITEM_WIDTH / 2}px`,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-none w-32 h-32 border border-black dark:border-white hover:opacity-60 transition-opacity cursor-pointer"
          >
            {item.imgSrc ? (
              <img
                src={item.imgSrc}
                alt={item.title}
                className="w-full h-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <div className="w-full h-full border border-black dark:border-white flex items-center justify-center font-mono text-xs text-black dark:text-white">
                {item.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
