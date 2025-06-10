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
      className="w-80 max-w-xs bg-gray-100 border-l border-gray-400 p-3 text-sm overflow-y-auto"
      style={{ height: '100vh' }}
    >
      {/* Close button */}
      <div className="text-right mb-2">
        <button className="text-gray-600 hover:text-gray-800" onClick={onClose}>✕</button>
      </div>
      <h2 className="font-bold text-base mb-2">{label} Details</h2>
      {page !== undefined && (
        <div className="mb-1"><strong>Page:</strong> {page}</div>
      )}
      {coords && (
        <div className="mb-2">
          <strong>Coordinates:</strong>{' '}
          top={coords.top.toFixed(1)}, left={coords.left.toFixed(1)}, 
          width={coords.width.toFixed(1)}, height={coords.height.toFixed(1)}
        </div>
      )}
      {content !== undefined ? (
        <pre className="bg-white p-2 border border-gray-300 rounded overflow-x-auto">
          {content}
        </pre>
      ) : (
        <p><em>No content available for this selection.</em></p>
      )}
    </div>
  );
};

export default InspectorSidebar;
