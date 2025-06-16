import React, { useState, useEffect, useContext } from 'react';
import { DocumentContext, TransformContext } from '@davidkric/pdf-components';

type Coord = { page: number; top: number; left: number; width: number; height: number };
type Token = { left: number; top: number; width: number; height: number; page: number; text: string; id?: string | number };

type SelectionOverlayProps = {
  pageIndex: number;
  active: boolean;
  onSelect: (tokens: Token[] | null) => void;
  tokens: Token[];
};

function rectsIntersect(a: Coord, b: Coord) {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ pageIndex, active, onSelect, tokens }) => {
  const documentContext = React.useContext(DocumentContext as any) as any;
  const transformContext = React.useContext(TransformContext as any) as any;
  const { pageDimensions } = documentContext;
  const { scale } = transformContext;
  
  if (!pageDimensions) {
    return null;
  }

  // Use the same coordinate system as React-PDF and core library components
  // React-PDF handles devicePixelRatio internally, so we only use base scale
  const renderedWidth = pageDimensions.width * scale;
  const renderedHeight = pageDimensions.height * scale;
  
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
    
    // Convert drag box from pixel to PDF-relative coordinates
    const x1 = Math.min(startPosition.x, x) / renderedWidth;
    const y1 = Math.min(startPosition.y, y) / renderedHeight;
    const w = Math.abs(x - startPosition.x) / renderedWidth;
    const h = Math.abs(y - startPosition.y) / renderedHeight;
    const region: Coord = { page: pageIndex, left: x1, top: y1, width: w, height: h };
    
    // Find intersecting tokens (must be on this page)
    const selected = tokens.filter(
      token =>
        token.page === pageIndex &&
        rectsIntersect(region, token)
    );
    
    onSelect(selected);
    
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
    width: renderedWidth,
    height: renderedHeight,
    cursor: active ? 'crosshair' : 'default',
    pointerEvents: active ? 'auto' : 'none',
    backgroundColor: active ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
    zIndex: 1000, // above text layer
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
