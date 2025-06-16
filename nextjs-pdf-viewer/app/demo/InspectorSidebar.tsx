import React from 'react';

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
      {/* Close button */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
        <h2 className="font-bold text-base text-gray-800">{label}</h2>
        <button 
          className="text-gray-500 hover:text-gray-700 text-lg font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100" 
          onClick={onClose}
          title="Close sidebar"
        >
          ×
        </button>
      </div>
      
      {/* Entity details */}
      <div className="space-y-3">
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
            <span className="font-semibold text-gray-600 block mb-2">Content:</span>
            <div className="bg-gray-50 p-3 border border-gray-200 rounded max-h-96 overflow-y-auto">
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
