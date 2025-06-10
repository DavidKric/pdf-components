import {
  BoundingBoxType,
  computeBoundingBoxStyle,
  DocumentContext,
  scaleRawBoundingBox,
  TransformContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { CoordType } from './Tabs/SingleLayer';

type Props = {
  pageIndex: number;
  altDown: boolean;
  createBlock: (block: CoordType) => void;
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const AuthorDragOverlay: React.FunctionComponent<Props> = ({
  pageIndex,
  altDown,
  createBlock,
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [startPosition, setStartPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [currPosition, setCurrPosition] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!altDown && startPosition != null && currPosition != null) {
      const block = {
        page: pageIndex,
        top: Math.min(startPosition.y, currPosition.y) / (pageDimensions.height * scale),
        left: Math.min(startPosition.x, currPosition.x) / (pageDimensions.width * scale),
        height: Math.abs(startPosition.y - currPosition.y) / (pageDimensions.height * scale),
        width: Math.abs(startPosition.x - currPosition.x) / (pageDimensions.width * scale),
        gid: -1,
      };
      createBlock(block);
      setStartPosition(null);
      setCurrPosition(null);
    }
  }, [altDown]);

  const getBoundingBoxStyle = (boxSize: BoundingBoxType) => {
    return computeBoundingBoxStyle(boxSize, pageDimensions, rotation, scale);
  };

  function handleMouseDown(event: React.MouseEvent) {
    // get current location
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    setStartPosition({ x, y });
    setCurrPosition({ x, y });
  }

  function handleMouseUp(event: React.MouseEvent) {
    // get current location
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    if (startPosition != null) {
      const block = {
        page: pageIndex,
        top: Math.min(startPosition.y, y) / scale,
        left: Math.min(startPosition.x, x) / scale,
        height: Math.abs(startPosition.y - y) / scale,
        width: Math.abs(startPosition.x - x) / scale,
        gid: -1,
      };
      createBlock(block);
    }
    setStartPosition(null);
    setCurrPosition(null);
  }

  function handleMouseMove(event: React.MouseEvent) {
    // get current location
    const { clientX, clientY } = event;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    setCurrPosition({ x, y });
  }

  function renderDraggingBox() {
    if (startPosition && currPosition) {
      const boxSize = {
        x1: Math.min(startPosition.x, currPosition.x),
        x2: Math.max(startPosition.x, currPosition.x),
        y1: Math.min(startPosition.y, currPosition.y),
        y2: Math.max(startPosition.y, currPosition.y),
      };
      const bbox = {
        top: boxSize.y1,
        left: boxSize.x1,
        width: boxSize.x2 - boxSize.x1,
        height: boxSize.y2 - boxSize.y1,
        page: pageIndex,
      };

      return <div className="reader__page-overlay__drag-box" style={bbox} />;
    }
    return null;
  }

  function renderSpace() {
    const bbox = scaleRawBoundingBox(
      { top: 0, left: 0, height: 1, width: 1, page: pageIndex },
      pageDimensions.height,
      pageDimensions.width
    );
    const style = getBoundingBoxStyle(bbox);
    return (
      <div
        key={pageIndex}
        className="reader__page-overlay__drag"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          ...style,
        }}></div>
    );
  }

  return (
    <>
      {altDown ? renderSpace() : null}
      {altDown ? renderDraggingBox() : null}
    </>
  );
};
