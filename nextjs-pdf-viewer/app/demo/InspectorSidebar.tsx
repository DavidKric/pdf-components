import React, { useState } from 'react';

type Entity = {
  type: string;
  label: string;
  content?: string;
  page?: number;
  coords?: { top: number; left: number; width: number; height: number };
};

type SidebarProps = {
  entity: Entity | null;
  onClose: () => void;
};

const InspectorSidebar: React.FC<SidebarProps> = ({ entity, onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  // Hidden when no entity selected
  if (!entity) return null;

  const { label, content, page, coords } = entity;
  return (
    <div
      className="bg-white border-l border-gray-300 shadow-lg p-4 text-sm overflow-y-auto h-full"
      style={{
        minHeight: '100vh',
        maxHeight: '100vh',
      }}
    >
      {/* Header with Title and Close button */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h2 className="font-bold text-lg text-gray-800">{label}</h2> {/* Slightly larger title */}
        <button
          className="text-gray-600 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={onClose}
          title="Close sidebar"
        >
          &times; {/* Using HTML entity for a cleaner 'x' */}
        </button>
      </div>

      {/* Entity details */}
      <div className="space-y-4"> {/* Increased spacing between sections */}
        {page !== undefined && (
          <div className="text-sm">
            <span className="font-semibold text-gray-600">Page:</span> 
            <span className="ml-2 text-gray-800">{page}</span>
          </div>
        )}
        
        {coords && (
          <div className="text-sm">
            <span className="font-semibold text-gray-600">Coordinates:</span>
            <div className="mt-1 text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
              top: {coords.top.toFixed(3)}<br/>
              left: {coords.left.toFixed(3)}<br/>
              width: {coords.width.toFixed(3)}<br/>
              height: {coords.height.toFixed(3)}
            </div>
          </div>
        )}
        
        {content !== undefined ? (
          <div className="text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-700 text-base">Content:</span>
              {content && ( // Only show button if content is not empty or null
                <button
                  onClick={async () => {
                    if (!content) return; // Should not happen if button is shown, but good practice
                    await navigator.clipboard.writeText(content);
                    setCopyButtonText('Copied!');
                    setTimeout(() => setCopyButtonText('Copy'), 2000);
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Copy content to clipboard"
                >
                  {copyButtonText}
                </button>
              )}
            </div>
            <div className="bg-gray-50 p-3 border border-gray-200 rounded-md max-h-96 overflow-y-auto mt-1">
              <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono leading-relaxed">
                {content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No content available for this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorSidebar;
