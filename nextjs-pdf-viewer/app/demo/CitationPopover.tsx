import React, { useEffect, useRef } from 'react';

interface CitationPopoverProps {
  content: string;
  position: { top: number; left: number; page: number, triggerHeight?: number }; // Added triggerHeight for potential future use
  onClose: () => void;
}

const CitationPopover: React.FC<CitationPopoverProps> = ({ content, position, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Improved styling
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    backgroundColor: 'white',
    border: '1px solid #e2e8f0', // Softer border color
    borderRadius: '6px', // Slightly more rounded
    padding: '12px 16px', // Increased padding
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // More pronounced shadow
    zIndex: 100,
    maxWidth: '350px', // Slightly wider
    fontSize: '0.875rem', // Tailwind 'text-sm'
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

  // Basic position adjustment: if too close to top, render below trigger (simplified)
  // This is a placeholder for more complex logic if needed.
  // For now, we assume `position.top` is already calculated to be below the trigger.
  // If `position.triggerHeight` was reliably passed and used:
  // if (position.top < 20 && position.triggerHeight) {
  // style.top = `${position.top + position.triggerHeight + 10}px`; // 10px offset below trigger
  // }


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
      <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '15px' }}> {/* Adjusted maxHeight and padding */}
        {content}
      </div>
    </div>
  );
};

export default CitationPopover;
