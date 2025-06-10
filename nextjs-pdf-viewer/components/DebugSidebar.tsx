import React from 'react';

type SelectedItem = {
  type: 'token' | 'line' | 'paragraph' | 'header' | 'title' | 'caption' | 'footnote';
  page: number;
  text?: string;
  coords: { top: number; left: number; width: number; height: number };
  id: string;
};

interface DebugSidebarProps {
  selectedItems: SelectedItem[];
  onItemClick: (item: SelectedItem) => void;
}

/**
 * Debug sidebar component that displays information about selected PDF elements.
 * Shows element type, coordinates, and text content for inspection.
 */
export const DebugSidebar: React.FC<DebugSidebarProps> = ({ selectedItems, onItemClick }) => {
  if (selectedItems.length === 0) {
    return (
      <div className="w-80 bg-gray-100 border-l border-gray-300 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Debug Panel</h3>
        <p className="text-gray-500 text-sm">
          Select elements by clicking on overlays or using Alt+drag to select multiple elements at once.
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-100 border-l border-gray-300 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Debug Panel ({selectedItems.length} selected)
      </h3>
      
      <div className="space-y-3">
        {selectedItems.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {item.type}
              </span>
              <span className="text-xs text-gray-500">
                Page {item.page + 1}
              </span>
            </div>
            
            {item.text && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {item.text.length > 60 ? `${item.text.substring(0, 60)}...` : item.text}
              </p>
            )}
            
            <div className="text-xs text-gray-500 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>Top: {Math.round(item.coords.top)}</div>
                <div>Left: {Math.round(item.coords.left)}</div>
                <div>Width: {Math.round(item.coords.width)}</div>
                <div>Height: {Math.round(item.coords.height)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        <strong>Usage Tips:</strong>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Hold Alt key to enable drag selection mode</li>
          <li>Click elements to inspect their properties</li>
          <li>Tokens have highest priority in selection</li>
          <li>Use overlay toggles to control visibility</li>
        </ul>
      </div>
    </div>
  );
}; 