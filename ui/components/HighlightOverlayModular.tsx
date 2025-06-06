import React, { useEffect, useState } from 'react';
import { BoundingBox, BoundingBoxType } from 'davidkric-pdf-components';
import { useUiContext } from '../context/UiContext';

interface Props {
  pageIndex: number;
}

export const HighlightOverlayModular: React.FC<Props> = ({ pageIndex }) => {
  const { isShowingHighlightOverlay } = useUiContext();
  const [boxes, setBoxes] = useState<BoundingBoxType[]>([]);

  useEffect(() => {
    async function fetchBoxes() {
      const res = await fetch('/ui/data/highlightBoundingBoxes.json');
      const data = await res.json();
      setBoxes(data[pageIndex] || []);
    }
    fetchBoxes();
  }, [pageIndex]);

  if (!isShowingHighlightOverlay) return null;

  return (
    <>
      {boxes.map((box, i) => (
        <BoundingBox
          key={i}
          {...box}
          className="reader__sample-highlight-overlay__bbox"
          isHighlighted={false}
        />
      ))}
    </>
  );
}; 