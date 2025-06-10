import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@davidkric/pdf-components';

// Generic box (absolute PDF coords, NOT scaled)
export type DragBox = {
  page: number;
  top: number; // in page space (points)
  left: number;
  width: number;
  height: number;
};

interface Props {
  pageIndex: number;
  /** when alt (⌥) is down we allow marquee selection */
  altDown: boolean;
  /** callback with page-relative drag rectangle (UNscaled points) */
  createBlock: (box: DragBox) => void;
}

/**
 * AuthorDragOverlay – transparent layer that turns the whole page into a
 * marquee selection surface when the user holds the ⌥ Alt / Option key.
 *
 * This is a minimal re-implementation of the original PaperMage component,
 * adapted for `@davidkric/pdf-components` (the AllenAI fork exposes slightly
 * different helpers, so we compute the CSS styles ourselves).
 */
export const AuthorDragOverlay: React.FC<Props> = ({ pageIndex, altDown, createBlock }) => {
  const { pageDimensions } = React.useContext(DocumentContext); // { width, height }
  const { scale } = React.useContext(TransformContext);

  // Points recorded in **page CSS pixels** (already scaled).
  const [startPt, setStartPt] = React.useState<{ x: number; y: number } | null>(null);
  const [currPt, setCurrPt] = React.useState<{ x: number; y: number } | null>(null);

  // ──────────────────────────────────────────────────────────── helpers
  const absStyleForPage = React.useMemo(() => {
    const w = pageDimensions.width * scale;
    const h = pageDimensions.height * scale;
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: w,
      height: h,
      cursor: 'crosshair',
    };
  }, [pageDimensions, scale]);

  const finishDrag = React.useCallback(() => {
    if (!startPt || !currPt) return;
    const x1 = Math.min(startPt.x, currPt.x);
    const y1 = Math.min(startPt.y, currPt.y);
    const x2 = Math.max(startPt.x, currPt.x);
    const y2 = Math.max(startPt.y, currPt.y);

    // Convert **CSS pixels** back to raw PDF points (divide by scale)
    const box: DragBox = {
      page: pageIndex,
      left: x1 / scale,
      top: y1 / scale,
      width: (x2 - x1) / scale,
      height: (y2 - y1) / scale,
    };
    createBlock(box);
  }, [startPt, currPt, scale, pageIndex, createBlock]);

  // ──────────────────────────────────────────────────────────── handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setStartPt({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrPt({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!startPt) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setCurrPt({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    finishDrag();
    setStartPt(null);
    setCurrPt(null);
  };

  // Remove listeners if alt is released mid-drag
  React.useEffect(() => {
    if (!altDown) {
      setStartPt(null);
      setCurrPt(null);
    }
  }, [altDown]);

  // ──────────────────────────────────────────────────────────── render
  const renderDragRect = () => {
    if (!startPt || !currPt) return null;
    const x1 = Math.min(startPt.x, currPt.x);
    const y1 = Math.min(startPt.y, currPt.y);
    const w = Math.abs(currPt.x - startPt.x);
    const h = Math.abs(currPt.y - startPt.y);
    return (
      <div
        className="absolute border-2 border-blue-500 border-dashed bg-blue-200 bg-opacity-20 pointer-events-none"
        style={{ top: y1, left: x1, width: w, height: h, zIndex: 5 }}
      />
    );
  };

  if (!altDown) return null;
  return (
    <>
      <div
        style={absStyleForPage}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {renderDragRect()}
    </>
  );
};

export default AuthorDragOverlay; 