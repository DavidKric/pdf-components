/**
 * Core types for PDF viewer functionality
 */

// Basic geometric types
export interface Point {
  x: number;
  y: number;
}

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// PDF element types
export interface Box {
  page: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TokenBox extends Box {
  text: string;
}

export interface LinkBox extends Box {
  refId?: string;
  figId?: string;
  isAnchor?: boolean;
}

// Selection and interaction types
export interface SelectedItem {
  type: 'token' | 'line' | 'paragraph' | 'header' | 'title' | 'caption' | 'footnote';
  page: number;
  text?: string;
  coords: { top: number; left: number; width: number; height: number };
  id: string;
}

// Feature toggle configuration
export interface FeatureToggles {
  tokens: boolean;
  rows: boolean;
  paragraphs: boolean;
  sectionHeaders: boolean;
  footnotes: boolean;
  captions: boolean;
  titles: boolean;
  skimming: boolean;
  thumbnails: boolean;
}

// PDF.js integration types
export interface PDFTextContent {
  items: PDFTextItem[];
}

export interface PDFTextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
}

// Overlay data structure
export interface OverlayData {
  lineBoxes: Box[];
  paragraphBoxes: Box[];
  headerBoxes: Box[];
  footnoteBoxes: Box[];
  captionBoxes: Box[];
  titleBoxes: Box[];
  citationLinks: LinkBox[];
  figureLinks: LinkBox[];
}

// Constants
export const CONSTANTS = {
  DPI_SCALE: 1.33, // Scale factor for PDF coordinates to pixel coordinates
  MIN_DRAG_DISTANCE: 3, // Minimum drag distance to trigger selection
  Z_INDEX: {
    PARAGRAPHS: 1,
    STRUCTURAL_ELEMENTS: 2, // Headers, titles, captions, footnotes
    LINES: 3,
    TOKENS: 4,
    SKIMMING_HIGHLIGHTS: 5,
    SELECTION_OVERLAY: 50,
  }
} as const; 