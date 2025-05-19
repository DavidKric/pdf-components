import { Dimensions } from '../components/types/boundingBox';

// Data from react-pdf/pdfjs that we need to compute the pixel size of the PDF's page(s).
export interface IPDFPageProxy {
  userUnit: number; // the default size of units in 1/72nds of an inch
  view: Array<number>; // format: [ top left x coordinate, top left y coordinate, bottom right x, bottom right y]
}

// We assume 96 DPI for display, but adjust for the current device's pixel ratio
const DEFAULT_DPI = 96;

export function getDisplayDPI(): number {
  if (typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number') {
    return DEFAULT_DPI * window.devicePixelRatio;
  }
  return DEFAULT_DPI;
}

// PDF units are in 1/72nds of an inch
const USER_UNIT_DENOMINATOR = 72;

/**
 * Given a PDFPageProxy, calculates the screen pixel size of the PDF page at 100% scale
 * @param page The PDFPageProxy to calculate size for
 * @returns Pixel size of a page at 100% scale assuming 96DPI display
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
