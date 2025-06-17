import React, { useEffect, useRef } from 'react';

interface FigurePopoverProps {
  caption: string;
  position: { top: number; left: number; page: number, triggerHeight?: number }; // Added triggerHeight
  onClose: () => void;
}

const FigurePopover: React.FC<FigurePopoverProps> = ({ caption, position, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    backgroundColor: 'white', // Consistent background with CitationPopover
    border: '1px solid #e2e8f0', // Softer border color
    borderRadius: '6px', // Slightly more rounded
    padding: '12px 16px', // Increased padding
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // More pronounced shadow
    zIndex: 100,
    maxWidth: '400px', // Allow a bit wider for captions which can be longer
    fontSize: '0.875rem',
  };

  // Close popover on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div style={style} ref={popoverRef}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px', // Adjusted for new padding
          right: '8px', // Adjusted for new padding
          background: 'transparent',
          border: 'none',
          fontSize: '1.2rem', // Slightly larger close button
          cursor: 'pointer',
          lineHeight: '1',
          padding: '0',
          color: '#4a5568', // Darker gray for better visibility
        }}
        aria-label="Close popover"
      >
        &times;
      </button>
      <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '15px' }}> {/* Adjusted maxHeight and padding */}
        {caption}
      </div>
    </div>
  );
};

export default FigurePopover;
