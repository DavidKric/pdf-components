import React, { createContext, useContext, useState } from 'react';

interface UiContextType {
  isShowingHighlightOverlay: boolean;
  toggleHighlightOverlay: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isShowingHighlightOverlay, setIsShowingHighlightOverlay] = useState(true);

  const toggleHighlightOverlay = () => {
    setIsShowingHighlightOverlay((prev) => !prev);
  };

  return (
    <UiContext.Provider value={{ isShowingHighlightOverlay, toggleHighlightOverlay }}>
      {children}
    </UiContext.Provider>
  );
};

export const useUiContext = () => {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUiContext must be used within a UiContextProvider');
  return context;
}; 