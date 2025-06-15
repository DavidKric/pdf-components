export type RelativeBBox = { left: number; top: number; width: number; height: number; page: number };
export type AbsoluteBBox = { left: number; top: number; width: number; height: number; page: number };

// Convert absolute bbox (pixels/points) to relative coords [0,1] using pdf page size
export function absoluteToRelativeBox(box: AbsoluteBBox, pdfWidth: number, pdfHeight: number): RelativeBBox {
  return {
    left: box.left / pdfWidth,
    top: box.top / pdfHeight,
    width: box.width / pdfWidth,
    height: box.height / pdfHeight,
    page: box.page,
  };
}

// Convert relative bbox to absolute pixel coords for current rendered page size
export function relativeToAbsoluteBox(box: RelativeBBox, renderedWidth: number, renderedHeight: number): AbsoluteBBox {
  return {
    left: box.left * renderedWidth,
    top: box.top * renderedHeight,
    width: box.width * renderedWidth,
    height: box.height * renderedHeight,
    page: box.page,
  };
} 