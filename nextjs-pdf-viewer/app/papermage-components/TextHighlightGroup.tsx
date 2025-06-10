import { BoundingBox } from '@davidkric/pdf-components';
import * as React from 'react';
import type { Box } from '../papermageAdapter';

type Props = {
  pageIndex: number;
  highlightGroups?: Box[][]; // groups of boxes belonging together
};

// Colour classes copied from PaperMage (6-cycle palette)
const COLOR_CLASSES = [
  'reader__text-highlight__bbox_0',
  'reader__text-highlight__bbox_1',
  'reader__text-highlight__bbox_2',
  'reader__text-highlight__bbox_3',
  'reader__text-highlight__bbox_4',
  'reader__text-highlight__bbox_5',
];

/** Draws a set of coloured bounding boxes with hover/opacity handled in CSS.
 *  It is intentionally dumb – the heavy lifting is done by the CSS classes.
 */
export const TextHighlightGroup: React.FC<Props> = ({ pageIndex, highlightGroups }) => {
  if (!highlightGroups || highlightGroups.length === 0) return null;

  return (
    <>
      {highlightGroups.map((group, gIdx) =>
        group
          .filter(b => b.page === pageIndex)
          .map((b, idx) => (
            <BoundingBox
              key={`${gIdx}-${idx}`}
              page={pageIndex}
              top={b.top}
              left={b.left}
              width={b.width}
              height={b.height}
              isHighlighted
              className={`reader__text-highlight__bbox ${COLOR_CLASSES[gIdx % COLOR_CLASSES.length]}`}
            />
          ))
      )}
    </>
  );
};

export default TextHighlightGroup; 