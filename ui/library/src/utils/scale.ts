import { Dimensions } from '../components/types/boundingBox';

// Data from react-pdf/pdfjs that we need to compute the pixel size of the PDF's page(s).
export interface IPDFPageProxy {
  userUnit: number; // the default size of units in 1/72nds of an inch
  view: Array<number>; // format: [ top left x coordinate, top left y coordinate, bottom right x, bottom right y]
}

// Standard DPI for web display - matches Semantic Reader's baseline
const DISPLAY_DPI = 96;

export function getDisplayDPI(): number {
  // Use base 96 DPI for consistent coordinate system
  // devicePixelRatio scaling is handled by React-PDF and CSS
  return DISPLAY_DPI;
}

// PDF units are in 1/72nds of an inch
const USER_UNIT_DENOMINATOR = 72;

/**
 * Given a PDFPageProxy, calculates the screen pixel size of the PDF page at 100% scale
 * @param page The PDFPageProxy to calculate size for
 * @returns Pixel size of a page at 100% scale at 96 DPI (matching Semantic Reader)
 */
export function computePageDimensions(page: IPDFPageProxy): Dimensions {
  const [leftPx, topPx, rightPx, bottomPx] = page.view;
  const dpi = getDisplayDPI();
  const PPI = (page.userUnit / USER_UNIT_DENOMINATOR) * dpi;

  return {
    height: (bottomPx - topPx) * PPI,
    width: (rightPx - leftPx) * PPI,
  };
}
