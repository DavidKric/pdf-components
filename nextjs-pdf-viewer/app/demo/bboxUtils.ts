export type RelativeBBox = { left: number; top: number; width: number; height: number; page: number };
export type AbsoluteBBox = { left: number; top: number; width: number; height: number; page: number };

// Convert absolute box (pixels or points) to relative [0,1] coordinates based on original PDF dimensions
export function absoluteToRelativeBox(
  box: AbsoluteBBox,
  pdfWidth: number,
  pdfHeight: number
): RelativeBBox {
  return {
    left: box.left / pdfWidth,
    top: box.top / pdfHeight,
    width: box.width / pdfWidth,
    height: box.height / pdfHeight,
    page: box.page,
  };
}

// Convert a relative bbox ([0,1]) to absolute pixels for the currently rendered page size
export function relativeToAbsoluteBox(
  box: RelativeBBox,
  renderedWidth: number,
  renderedHeight: number
): AbsoluteBBox {
  return {
    left: box.left * renderedWidth,
    top: box.top * renderedHeight,
    width: box.width * renderedWidth,
    height: box.height * renderedHeight,
    page: box.page,
  };
} 