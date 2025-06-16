import * as React from 'react';

import { logProviderWarning } from '../utils/provider';
import { PageRotation } from '../utils/rotate';

export const DEFAULT_ZOOM_SCALE = 1.0;
export interface ITransformContext {
  pixelRatio: number;
  rotation: PageRotation;
  scale: number;
  zoomIncrementValue: number;
  setPixelRatio: (devicePixelRatio: number) => void;
  setRotation: (rotation: PageRotation) => void;
  setScale: (scale: number) => void;
  setZoomIncrementValue: (value: number) => void;
}

// Allow higher pixel ratios for sharp rendering on high DPI displays
const getCappadPixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  // Remove the 1.5x cap to allow full devicePixelRatio for sharpness
  // Modern displays (MacBook Retina, etc.) need 2x+ for optimal quality
  return window.devicePixelRatio || 1;
};

export const TransformContext = React.createContext<ITransformContext>({
  pixelRatio: getCappadPixelRatio(),
  rotation: PageRotation.Rotate0,
  scale: 1,
  zoomIncrementValue: 0.2,
  setPixelRatio: pixelRatio => {
    logProviderWarning(`setPixelRatio(${pixelRatio})`, 'TransformContext');
  },
  setRotation: rotation => {
    logProviderWarning(`setRotation(${rotation})`, 'TransformContext');
  },
  setScale: scale => {
    logProviderWarning(`setScale(${scale})`, 'TransformContext');
  },
  setZoomIncrementValue: value => {
    logProviderWarning(`setZoomIncrementValue(${value})`, 'TransformContext');
  },
});

export function useTransformContextProps(): ITransformContext {
  const [pixelRatio, setPixelRatio] = React.useState<number>(getCappadPixelRatio());
  const [rotation, setRotation] = React.useState<PageRotation>(PageRotation.Rotate0);
  const [scale, setScale] = React.useState<number>(DEFAULT_ZOOM_SCALE);
  const [zoomIncrementValue, setZoomIncrementValue] = React.useState<number>(0.2);

  // Memoize setters to prevent infinite re-renders in components that use them as dependencies
  const memoizedSetPixelRatio = React.useCallback((pixelRatio: number) => {
    setPixelRatio(pixelRatio);
  }, []);

  const memoizedSetRotation = React.useCallback((rotation: PageRotation) => {
    setRotation(rotation);
  }, []);

  const memoizedSetScale = React.useCallback((scale: number) => {
    setScale(scale);
  }, []);

  const memoizedSetZoomIncrementValue = React.useCallback((value: number) => {
    setZoomIncrementValue(value);
  }, []);

  return {
    pixelRatio,
    rotation,
    scale,
    zoomIncrementValue,
    setPixelRatio: memoizedSetPixelRatio,
    setRotation: memoizedSetRotation,
    setScale: memoizedSetScale,
    setZoomIncrementValue: memoizedSetZoomIncrementValue,
  };
}
