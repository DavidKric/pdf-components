// File: nextjs-pdf-viewer/components/DocumentViewer.tsx

import React from 'react';
import { PageComponent } from './PageComponent'; // assume this renders <div className="pdf-reader__page" ...>

interface DocumentViewerProps {
  numPages: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ numPages }) => {
  return (
    <div className="pdf-reader__page-list">
      {Array.from({ length: numPages }, (_, index) => (
        <PageComponent key={index + 1} pageNumber={index + 1} />
      ))}
    </div>
  );
};
