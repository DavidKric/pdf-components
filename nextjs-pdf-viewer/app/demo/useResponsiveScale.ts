import { useRef, useEffect, useState, useCallback } from 'react';

interface UseResponsiveScaleOptions {
  sidebarWidth?: number;
  defaultPdfWidth?: number;
  minScale?: number;
  maxScale?: number;
}

export const useResponsiveScale = (options: UseResponsiveScaleOptions = {}) => {
  const {
    sidebarWidth = 320,
    defaultPdfWidth = 800, // Typical PDF page width in points
    minScale = 0.5,
    maxScale = 2.0
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const availableWidth = rect.width - 40; // Account for padding
      const calculatedScale = Math.min(Math.max(availableWidth / defaultPdfWidth, minScale), maxScale);
      
      setContainerWidth(availableWidth);
      setScale(calculatedScale);
    }
  }, [defaultPdfWidth, minScale, maxScale]);

  useEffect(() => {
    // Initial calculation
    updateScale();

    // Set up resize observer for more accurate container size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize listener
    const handleWindowResize = () => {
      setTimeout(updateScale, 100); // Debounce
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [updateScale]);

  return {
    containerRef,
    containerWidth,
    scale,
    updateScale
  };
}; 