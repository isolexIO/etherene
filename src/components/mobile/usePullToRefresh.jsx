import { useEffect, useRef, useState } from 'react';

export default function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // The ref div isn't the scroll container — the window scrolls. So we
    // check the actual page scroll position to decide whether a downward
    // swipe is a pull-to-refresh (page at top) or normal scrolling.
    const isAtTop = () => (container.scrollTop || window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const handleTouchStart = (e) => {
      if (isAtTop()) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (startYRef.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startYRef.current);

      if (distance > 0 && isAtTop()) {
        e.preventDefault();
        setPullDistance(Math.min(distance, 120));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 60 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh?.();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      startYRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, onRefresh]);

  return {
    scrollContainerRef,
    isRefreshing,
    pullDistance
  };
}