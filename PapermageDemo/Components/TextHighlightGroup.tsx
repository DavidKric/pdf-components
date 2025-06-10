import { BoundingBox } from '@allenai/pdf-components';
import * as React from 'react';

import { CoordType } from '../pages/Reader';

type Props = {
  pageIndex: number;
  hoveredIdx: undefined | number;
  setHoveredIdx: React.Dispatch<React.SetStateAction<undefined | number>>;
  highlightGroups?: CoordType[][];
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const TextHighlightGroup: React.FunctionComponent<Props> = ({
  pageIndex,
  highlightGroups,
  hoveredIdx,
  setHoveredIdx,
}: Props) => {
  if (!highlightGroups || highlightGroups.length === 0) {
    return null;
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    if (!highlightGroups || highlightGroups.length === 0) {
      return [];
    }
    highlightGroups.map((highlightGroup, idx) => {
      highlightGroup.map((highlight, boxIdx) => {
        // Only render this BoundingBox if it belongs on the current page
        if (highlight.page === pageIndex) {
          const key = `${highlight.gid % 6}_${highlight.top}_${highlight.left}_${highlight.width}_${
            highlight.height
          }`;
          const props = {
            ...highlight,
            ...(boxIdx === 0 && { id: `scrollToBox_${idx}` }),
            className: `reader__text-highlight__bbox reader__text-highlight__bbox_${
              highlight.gid % 6
            }${hoveredIdx === idx ? ' reader__text-highlight__bbox_hovered' : ''}`,
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key,
            onMouseOver: () => setHoveredIdx(idx),
            onMouseOut: () => setHoveredIdx(undefined),
            onClick: () => {
              const element = document.getElementById(`scrollToJson_${idx}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            },
          };

          boxes.push(<BoundingBox {...props} />);
          //boxes.push(<BoundingBox {...props} key={Object.values(highlight).join('-')} />);
        }
      });
    });
    return boxes;
  }
  const boxes = renderHighlightedBoundingBoxes();

  return <React.Fragment>{boxes}</React.Fragment>;
};
