import React, { useState, useEffect, useContext } from 'react';
import { DocumentContext, TransformContext } from '@davidkric/pdf-components';

type Coord = { page: number; top: number; left: number; width: number; height: number };

type SelectionOverlayProps = {
  pageIndex: number;
  active: boolean;
  onSelect: (region: Coord | null) => void;
};

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ pageIndex, active, onSelect }) => {
  const { pageDimensions } = useContext(DocumentContext);
  const { scale } = useContext(TransformContext);
  // Track drag start and current positions in pixels (relative to this overlay)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // When drag ends (mouse up and active was true), compute the selection region
  useEffect(() => {
    if (!active && startPos && currentPos) {
      // Compute coordinates in original PDF space (divide out the current scale)
      const x1 = Math.min(startPos.x, currentPos.x) / scale;
      const y1 = Math.min(startPos.y, currentPos.y) / scale;
      const x2 = Math.max(startPos.x, currentPos.x) / scale;
      const y2 = Math.max(startPos.y, currentPos.y) / scale;
      const region: Coord = {
        page: pageIndex,
        top: y1,
        left: x1,
        width: x2 - x1,
        height: y2 - y1,
      };
      onSelect(region);
      // Reset positions
      setStartPos(null);
      setCurrentPos(null);
    }
    // Only trigger on change of `active` (when user releases selection mode)
  }, [active]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setStartPos({ x: offsetX, y: offsetY });
    setCurrentPos({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active || !startPos) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setCurrentPos({ x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    if (!active) return;
    if (startPos && currentPos) {
      // If mouse was released, the effect above will handle computing region
      // Just deactivate drawing state (effect will run on active=false)
    } else {
      // Mouse up without a selection (simple click) – no region
      onSelect(null);
    }
    // Either way, end dragging
    setStartPos(null);
    setCurrentPos(null);
  };

  // Calculate style for the blue selection rectangle during drag
  let dragBoxStyle: React.CSSProperties | undefined;
  if (startPos && currentPos) {
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);
    dragBoxStyle = { position: 'absolute', top: y, left: x, width: w, height: h };
  }

  // Style for the full-page transparent overlay area
  const fullOverlayStyle: React.CSSProperties = pageDimensions.width && pageDimensions.height ? {
    position: 'absolute',
    top: 0,
    left: 0,
    // scale page dimensions by 100% (Overlay container is already scaled by TransformContext)
    width: pageDimensions.width,
    height: pageDimensions.height,
    // When not active, pointer events are none to allow interacting with underlying content
    pointerEvents: active ? 'auto' : 'none',
  } : {};

  return (
    <>
      {/* Transparent overlay that captures drag events when selection mode is active */}
      <div
        className="pdf-selection-overlay"
        style={fullOverlayStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {/* The semi-transparent selection box that is drawn while dragging */}
      {startPos && currentPos && (
        <div 
          className="pdf-selection-box" 
          style={{ ...dragBoxStyle, backgroundColor: '#1075ff', opacity: 0.2, pointerEvents: 'none' }} 
        />
      )}
    </>
  );
};

export default SelectionOverlay;
