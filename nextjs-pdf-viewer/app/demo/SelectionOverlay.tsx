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
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [currPosition, setCurrPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!active) return;
    
    // Get current location relative to the overlay
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    
    setStartPosition({ x, y });
    setCurrPosition({ x, y });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!active || !startPosition) return;
    
    // Get current location relative to the overlay
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    
    setCurrPosition({ x, y });
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!active || !startPosition) return;
    
    // Get current location relative to the overlay
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    
    // Calculate the selection region in relative coordinates (0-1)
    const region: Coord = {
      page: pageIndex,
      top: Math.min(startPosition.y, y) / (pageDimensions.height * scale),
      left: Math.min(startPosition.x, x) / (pageDimensions.width * scale),
      width: Math.abs(startPosition.x - x) / (pageDimensions.width * scale),
      height: Math.abs(startPosition.y - y) / (pageDimensions.height * scale),
    };
    
    onSelect(region);
    
    // Reset positions
    setStartPosition(null);
    setCurrPosition(null);
  };

  // Render the selection box while dragging
  const renderDragBox = () => {
    if (!startPosition || !currPosition) return null;
    
    const boxStyle = {
      position: 'absolute' as const,
      left: Math.min(startPosition.x, currPosition.x),
      top: Math.min(startPosition.y, currPosition.y),
      width: Math.abs(currPosition.x - startPosition.x),
      height: Math.abs(currPosition.y - startPosition.y),
      backgroundColor: 'rgba(16, 117, 255, 0.2)',
      border: '2px solid rgba(16, 117, 255, 0.8)',
      pointerEvents: 'none' as const,
      zIndex: 1000,
    };
    
    return <div style={boxStyle} />;
  };

  // Style for the full-page overlay area
  const overlayStyle: React.CSSProperties = pageDimensions.width && pageDimensions.height ? {
    position: 'absolute',
    top: 0,
    left: 0,
    width: pageDimensions.width * scale,
    height: pageDimensions.height * scale,
    cursor: active ? 'crosshair' : 'default',
    pointerEvents: active ? 'auto' : 'none',
    backgroundColor: active ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
  } : {};

  return (
    <>
      {/* Full-page overlay that captures drag events when selection mode is active */}
      {active && (
        <div
          className="pdf-selection-overlay"
          style={overlayStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}
      
      {/* The selection box that is drawn while dragging */}
      {active && renderDragBox()}
    </>
  );
};

export default SelectionOverlay;
