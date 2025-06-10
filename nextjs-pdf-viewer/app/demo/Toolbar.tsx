import React from 'react';

type ToggleProps = {
  toggles: { [key: string]: boolean };
  onToggle: (key: string) => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
};

const Toolbar: React.FC<ToggleProps> = ({ toggles, onToggle, selectionMode, onToggleSelection }) => {
  return (
    <div className="fixed top-12 left-0 right-0 h-12 bg-gray-800 text-gray-100 flex items-center px-4 z-40 shadow">
      <span className="font-bold text-sm text-yellow-400 mr-4">
        Semantic Reader + PaperMage Demo
      </span>
      {/** Overlay layer toggle buttons */}
      {([
        ['tokens', 'Tokens'],
        ['lines', 'Lines'],
        ['paragraphs', 'Paragraphs'],
        ['sectionHeaders', 'Section Headers'],
        ['titles', 'Titles'],
        ['captions', 'Captions'],
        ['footnotes', 'Footnotes'],
        ['images', 'Images'],
        // (You could add 'skimming' or other debug layers here as needed)
      ] as const).map(([key, label]) => (
        <button 
          key={key}
          className={`mr-1 px-2 py-1 rounded text-xs ${
            toggles[key] 
              ? 'bg-gray-700 text-yellow-300'        // active: highlighted
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          onClick={() => onToggle(key)}
        >
          {label}
        </button>
      ))}
      {/** Selection mode toggle */}
      <button
        className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
          selectionMode 
            ? 'bg-blue-700 text-white'              // indicate when selection mode is active
            : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
        }`}
        onClick={onToggleSelection}
        title="Drag to select a region"
      >
        {selectionMode ? 'Selection: ON' : 'Selection Mode'}
      </button>
    </div>
  );
};

export default Toolbar;
