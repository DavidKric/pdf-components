import React from 'react';
import { Overlay } from '@davidkric/pdf-components';

interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SelectionOverlayProps {
  isSelectingMode: boolean;
  pageIndex: number;
  currentPage: number | null;
  selectionRect: SelectionRect | null;
  onSelectionStart: (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => void;
  onSelectionMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelectionEnd: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Renders the drag-to-select overlay for marquee selection functionality.
 * Captures mouse events and renders the selection rectangle during dragging.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isSelectingMode,
  pageIndex,
  currentPage,
  selectionRect,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
}) => {
  if (!isSelectingMode) return null;

  return (
    <Overlay>
      <div 
        className="absolute inset-0 cursor-crosshair" 
        onMouseDown={(e) => onSelectionStart(e, pageIndex)}
        onMouseMove={onSelectionMove}
        onMouseUp={onSelectionEnd}
        style={{ 
          backgroundColor: 'transparent',
          pointerEvents: 'auto',
          zIndex: 50 // Highest z-index to capture mouse events above all overlays
        }}
      >
        {/* Selection rectangle visualization */}
        {selectionRect && currentPage === pageIndex && (
          <div 
            className="absolute border-2 border-blue-500 border-dashed bg-blue-100 bg-opacity-25 pointer-events-none"
            style={{
              top: selectionRect.top, 
              left: selectionRect.left,
              width: selectionRect.width, 
              height: selectionRect.height
            }}
          />
        )}
      </div>
    </Overlay>
  );
}; 