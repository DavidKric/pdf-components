'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  DocumentContext,
  TransformContext,
  PageWrapper,
  RENDER_TYPE,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';

import type { DoclingDocument, TextItem, GroupItem, RefItem, PictureItem } from '@docling/docling-core';

import rawJson from '../2408.09869v3.json';
import Toolbar from './Toolbar';
import OverlayRenderer from './OverlayRenderer';
import InspectorSidebar from './InspectorSidebar';
import { absoluteToRelativeBox } from './bboxUtils';

interface SelectedEntity {
  type: string;
  label: string;
  content?: string;
  page?: number;
  coords?: { top: number; left: number; width: number; height: number };
}

// Load and cast the Docling JSON as a DoclingDocument
const docData = rawJson as DoclingDocument;  // The structured document content (tokens, paragraphs, etc.)

// Token extraction function using the PDF.js instance from @davidkric/pdf-components
async function extractTokenBBoxes(pdfDocument: any): Promise<Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>> {
  if (!pdfDocument) return [];
  
  const allTokens: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const pageHeight = viewport.height;

    textContent.items.forEach((item: any) => {
      // Explicitly check if item.str is null or undefined
      if (typeof item.str === 'undefined' || item.str === null) {
        console.warn('extractTokenBBoxes: item.str is undefined or null. Item structure:', JSON.stringify(item));
        // Optionally, skip this item or handle as an error
        return;
      }

      // Check if item.str is a string and then if it's non-empty after trimming
      if (typeof item.str === 'string' && item.str.trim()) {
        // PDF.js uses a bottom-left origin; y increases up the page.
        // item.transform = [scaleX, skewX, skewY, scaleY, transX, transY]
        const [,, , , x, y] = item.transform;

        allTokens.push({
          text: item.str,
          left: x,
          // Convert from bottom-left to top-left origin
          top: pageHeight - y - item.height,
          width: item.width,
          height: item.height,
          page: pageNum - 1, // Convert to 0-indexed
        });
      } else if (typeof item.str !== 'string') {
        // Log if item.str is not a string (but not null/undefined, handled above)
        console.warn('extractTokenBBoxes: item.str is not a string. Item structure:', JSON.stringify(item));
      }
      // If item.str is an empty string or only whitespace, it's skipped by item.str.trim()
      // This is likely desired behavior, so no explicit logging for that case unless specified.
    });
  }
  
  return allTokens;
}

// Component to extract tokens using DocumentContext
const TokenExtractor: React.FC<{ onTokensExtracted: (tokens: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>) => void }> = ({ onTokensExtracted }) => {
  const documentContext = React.useContext(DocumentContext as any) as any;
  const pdfDocProxy = documentContext.pdfDocProxy;

  useEffect(() => {
    const extractTokens = async () => {
      console.log('DocumentContext pdfDocProxy:', pdfDocProxy);
      
      if (pdfDocProxy) {
        try {
          const tokens = await extractTokenBBoxes(pdfDocProxy);
          onTokensExtracted(tokens);
          console.log(`Extracted ${tokens.length} tokens from PDF`);
        } catch (error) {
          console.error('Failed to extract tokens from PDF:', error);
        }
      } else {
        console.log('PDF document not yet loaded');
      }
    };
    
    extractTokens();
  }, [pdfDocProxy, onTokensExtracted]);

  return null; // This component doesn't render anything
};

// Move Pages component outside to prevent re-creation on every render
const Pages: React.FC<{
  toggles: { [key: string]: boolean };
  tokenHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  lineHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  paragraphHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  headerHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  titleHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  captionHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  footnoteHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>;
  citationLinks: Array<{ page: number; top: number; left: number; width: number; height: number; refId: string; text: string; isAnchor?: boolean }>;
  figureLinks: Array<{ page: number; top: number; left: number; width: number; height: number; figId: string; text: string; isAnchor?: boolean }>;
  pictureHighlights: Array<{ page: number; top: number; left: number; width: number; height: number }>;
  selectionMode: boolean;
  isFocusMode: boolean; // Added for focus mode
  selectedEntity: SelectedEntity | null; // Added for focus mode
  bibliography: { [refId: string]: string }; // Added for citation popovers
  figureCaptions: { [figId: string]: string }; // Added for figure popovers
  onEntitySelect: (entity: SelectedEntity | null) => void;
}> = React.memo(({
  toggles,
  tokenHighlights,
  lineHighlights,
  paragraphHighlights,
  headerHighlights,
  titleHighlights,
  captionHighlights,
  footnoteHighlights,
  citationLinks,
  figureLinks,
  pictureHighlights,
  selectionMode,
  isFocusMode, // Added for focus mode
  selectedEntity, // Added for focus mode
  bibliography, // Added for citation popovers
  figureCaptions, // Added for figure popovers
  onEntitySelect,
}) => {
  const documentContext = React.useContext(DocumentContext as any) as any;
  const numPages = documentContext.numPages;
  if (!numPages || numPages <= 0) return null;
  
  return (
    <>
      {Array.from({ length: numPages }).map((_, pageIndex) => (
        <PageWrapper key={pageIndex} pageIndex={pageIndex} renderType={RENDER_TYPE.MULTI_CANVAS}>
          <OverlayRenderer
            onlyPage={pageIndex}
            toggles={toggles}
            tokenHighlights={tokenHighlights}
            lineHighlights={lineHighlights}
            paragraphHighlights={paragraphHighlights}
            headerHighlights={headerHighlights}
            titleHighlights={titleHighlights}
            captionHighlights={captionHighlights}
            footnoteHighlights={footnoteHighlights}
            citationLinks={citationLinks}
            figureLinks={figureLinks}
            imageHighlights={pictureHighlights}
            selectionMode={selectionMode}
            isFocusMode={isFocusMode} // Pass isFocusMode
            selectedEntity={selectedEntity} // Pass selectedEntity
            bibliography={bibliography} // Pass bibliography
            figureCaptions={figureCaptions} // Pass figureCaptions
            onEntitySelect={onEntitySelect}
            onRegionSelect={onEntitySelect}
          />
        </PageWrapper>
      ))}
    </>
  );
});

Pages.displayName = 'Pages';

const PDFViewerDemoWithDocling: React.FC = () => {
  // State for which overlay layers are visible
  const [toggles, setToggles] = useState({
    tokens: false,
    lines: false,
    paragraphs: false,
    sectionHeaders: false,
    titles: false,
    captions: false,
    footnotes: false,
    images: false,
    tables: false,
    formulas: false,
    codes: false,
    furniture: false,
    // Additional overlays like skimming highlights can be added here if needed
  });
  // State for selection mode (drag-to-select tool)
  const [selectionMode, setSelectionMode] = useState(false);
  // State for focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);
  // State for the currently selected entity to display in the sidebar
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [extractedTokens, setExtractedTokens] = useState<Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>>([]);

  // Callback to receive extracted tokens
  const handleTokensExtracted = useCallback((tokens: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>) => {
    console.log('Received extracted tokens:', tokens.length);
    console.log('First 5 tokens:', tokens.slice(0, 5));
    setExtractedTokens(tokens);
  }, []);

  // Toggle function for overlay feature buttons
  const toggleFeature = useCallback((key: keyof typeof toggles) => {
    console.log('Toggling feature:', key);
    // Determine the new state of the toggle
    const newToggleState = !toggles[key];

    setToggles(prev => ({ ...prev, [key]: newToggleState }));

    // If tokens layer is being turned OFF, clear any selected entity
    if (key === 'tokens' && !newToggleState) {
      console.log('Tokens layer turned off, clearing selected entity.');
      setSelectedEntity(null);
    }
  }, [toggles]); // Dependency array should include `toggles` to get the latest state

  // Callback when an overlay annotation is clicked – capture its data for the inspector
  const handleEntitySelect = useCallback((entity: SelectedEntity | null) => {
    console.log('Entity selected:', entity);
    setSelectedEntity(entity);
  }, []);

  // Precompute all overlay bounding boxes from the DoclingDocument - memoized separately from toggles
  const overlayData = useMemo(() => {
    /** 
     * Map raw DoclingDocument content to overlay highlight boxes.
     * We convert each recognized entity (tokens, lines, paragraphs, etc.) into 
     * an absolute positioned box on the page, using coordinates from docData.
     * PaperMage uses a similar approach:contentReference[oaicite:1]{index=1}:contentReference[oaicite:2]{index=2}:
     * for each TextItem in the doc, we create overlays for its paragraph region and lines/tokens.
     */
    // Record the exact height (in points/pixels) for every page so we can transform
    // bottom-left PDF coordinates (origin) to top-left CSS coordinates accurately.
    const pageHeights = Array.isArray(docData.pages)
      ? docData.pages.map((p: any) => p?.size?.height)
      : [];
    const pageWidths = Array.isArray(docData.pages)
      ? docData.pages.map((p: any) => p?.size?.width)
      : [];
    const DEFAULT_PAGE_HEIGHT = pageHeights[0] ?? 792; // Default fallback page height (e.g., US Letter portrait)
    const DEFAULT_PAGE_WIDTH = pageWidths[0] ?? 612;   // Default fallback page width (e.g., US Letter portrait)

    // POINT_TO_PIXEL is used when converting PDF coordinates (often in points) to CSS pixel values.
    // A standard PDF point is 1/72 of an inch. Web browsers typically render at 96 DPI (dots per inch).
    // So, to convert points to pixels for web display: value_in_pixels = value_in_points * (96 / 72).
    // However, in this specific `overlayData` block, most coordinates are being converted
    // to be *relative* to page dimensions (0-1 range). The actual scaling to screen pixels
    // is then handled by the `OverlayRenderer` using `styleFromRel` which considers the
    // current zoom/transform scale from `TransformContext`.
    // The `POINT_TO_PIXEL` constant is used here primarily in `computeSegmentPosition`
    // where line bounding boxes (which might be in points from `docData.prov.bbox`) are used
    // to calculate sub-line segment positions (like for citation links).
    // If `docData.prov.bbox` coordinates were consistently in a different unit, this might need adjustment,
    // but typically PDF coordinates are in points.
    const POINT_TO_PIXEL = 96 / 72;
    
    // Use extracted tokens from PDF.js instead of heuristic generation
    const tokenList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = 
      extractedTokens.map(token => {
        const pageHeight = pageHeights[token.page] ?? DEFAULT_PAGE_HEIGHT;
        const pageWidth = pageWidths[token.page] ?? DEFAULT_PAGE_WIDTH;
        
        // Convert absolute coordinates to relative coordinates
        return {
          page: token.page,
          top: token.top / pageHeight,
          left: token.left / pageWidth,
          width: token.width / pageWidth,
          height: token.height / pageHeight,
          text: token.text,
        };
      });
    const lineList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const paragraphList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const headerList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const titleList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const captionList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const footnoteList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const citationLinkList: Array<{ page: number; top: number; left: number; width: number; height: number; refId: string; text: string; isAnchor?: boolean }> = [];
    const figureLinkList: Array<{ page: number; top: number; left: number; width: number; height: number; figId: string; text: string; isAnchor?: boolean }> = [];
    const pictureList: Array<{ page: number; top: number; left: number; width: number; height: number }> = [];
    const bibliography: { [refId: string]: string } = {}; // For citation popovers
    const figureCaptions: { [figId: string]: string } = {}; // For figure popovers

    // New highlight lists
    const tableHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const formulaHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const codeHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
    const furnitureHighlights: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];


    // Helper to compute token horizontal position/width within a line:
    const computeSegmentPosition = (lineText: string, segmentStartIdx: number, segmentEndIdx: number, lineBBox: { l: number; r: number; t: number; b: number }) => {
      // Remove spaces for length calculations (to distribute width proportional to characters)
      const textNoSpaces = lineText.replace(/ /g, '');
      const totalChars = textNoSpaces.length || 1;
      const prefixChars = lineText.slice(0, segmentStartIdx).replace(/ /g, '').length;
      const segmentChars = lineText.slice(segmentStartIdx, segmentEndIdx).replace(/ /g, '').length;
      // Determine segment start and end as fraction of the full line width
      const { l: lineLeft, r: lineRight } = lineBBox;
      const ratioStart = prefixChars / totalChars;
      const ratioEnd = (prefixChars + segmentChars) / totalChars;
      const segLeft = lineLeft + ratioStart * (lineRight - lineLeft);
      const segWidth = (ratioEnd - ratioStart) * (lineRight - lineLeft);
      return { left: segLeft, width: segWidth };
    };

    // Process Docling document for other overlays (paragraphs, headers, etc.) but not tokens
    // Generic BBox processing function
    const processItemBBox = (item: any, itemTypeLabel: string) => {
      if (!item.prov?.[0]?.bbox) return null;
      const bbox = item.prov[0].bbox;
      const pageIndex = (item.prov[0].page_no || 1) - 1;
      const { t: pdfTop, b: pdfBottom, l: pdfLeft, r: pdfRight } = bbox;

      const pageHeight = pageHeights[pageIndex] ?? DEFAULT_PAGE_HEIGHT;
      const pageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;

      const elemHeight = pdfTop - pdfBottom;
      const elemWidth = pdfRight - pdfLeft;

      const topRel = (pageHeight - pdfTop) / pageHeight;
      const leftRel = pdfLeft / pageWidth;
      const widthRel = elemWidth / pageWidth;
      const heightRel = elemHeight / pageHeight;

      const highlightData = {
        page: pageIndex,
        top: topRel,
        left: leftRel,
        width: widthRel,
        height: heightRel,
        text: item.text || item.label || itemTypeLabel, // Use available text or label
      };

      // Furniture Check (assuming 'content_layer' property exists and "FURNITURE" is its string value)
      // Docling core might use an enum like ContentLayer.FURNITURE, check actual value if possible.
      if (item.content_layer === "FURNITURE") { // Replace "FURNITURE" with actual enum value if different
        furnitureHighlights.push({ ...highlightData, text: `${itemTypeLabel} (Furniture)` });
      }

      return highlightData;
    };

    (docData.texts ?? []).forEach((item: any) => {
      const highlightData = processItemBBox(item, item.label || 'text');
      if (!highlightData) return;

      const { text: itemText } = item; // item.text often holds the actual string content
      const itemLabel = item.label || 'text'; // item.label holds the type like 'section_header'

      // Existing logic for text types
      const allowedLabels = ['text', 'section_header', 'title', 'caption', 'footnote', 'list_item'];
      if (!allowedLabels.includes(itemLabel) && item.content_layer !== "FURNITURE") return; // Skip if not furniture and not an allowed text label

      if (item.content_layer === "FURNITURE") {
        // Already processed by generic furniture check in processItemBBox if furniture toggle is on
        // No specific list for "text furniture", it goes into generic furnitureHighlights
      } else {
        // Identify and record high-level elements by label:
        if (itemLabel === 'text' && itemText) {
          if (itemText.length > 100) { // Heuristic for paragraph
            paragraphList.push({ ...highlightData, text: itemText });
          }
        } else if (itemLabel === 'section_header' && itemText) {
          headerList.push({ ...highlightData, text: itemText });
        } else if (itemLabel === 'title' && itemText) {
          titleList.push({ ...highlightData, text: itemText });
        } else if (itemLabel === 'caption' && itemText) {
          captionList.push({ ...highlightData, text: itemText });
        } else if (itemLabel === 'footnote' && itemText) {
          footnoteList.push({ ...highlightData, text: itemText });
        }

        // If the item has actual text content, further break it down into line overlays
        if (itemText) {
          const lines = itemText.split('\n');
          const lineHeightRel = lines.length > 1 ? highlightData.height / lines.length : highlightData.height;
          lines.forEach((lineStr: string, lineIdx: number) => {
            const lineTopPDF = (pageHeights[highlightData.page] ?? DEFAULT_PAGE_HEIGHT) * (1 - highlightData.top) - lineIdx * (pageHeights[highlightData.page] ?? DEFAULT_PAGE_HEIGHT) * lineHeightRel; // Approximate
            const cssLineTopRel = highlightData.top + lineIdx * lineHeightRel;
            lineList.push({
              page: highlightData.page,
              top: cssLineTopRel,
              left: highlightData.left,
              width: highlightData.width,
              height: lineHeightRel,
              text: lineStr,
            });

            const citationPattern = /\[(\d+(?:[\-,]\s*\d+)*)\]/g;
            let citeMatch: RegExpExecArray | null;
            while ((citeMatch = citationPattern.exec(lineStr)) !== null) {
              const matchText = citeMatch[0];
              const matchStart = citeMatch.index;
              const matchEnd = matchStart + matchText.length;
              const { bbox: provBBox } = item.prov[0];
              const scaledCiteBBox = { l: provBBox.l * POINT_TO_PIXEL, r: provBBox.r * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - (pageHeights[highlightData.page] ?? DEFAULT_PAGE_HEIGHT) * lineHeightRel) * POINT_TO_PIXEL };
              const { left: citeLeft, width: citeWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledCiteBBox);
              const targetNum = citeMatch[1].split(/[\-,]/)[0].trim();
              citationLinkList.push({
                page: highlightData.page, top: cssLineTopRel, left: citeLeft, width: citeWidth, height: lineHeightRel, refId: `ref-${targetNum}`, text: matchText,
              });
            }
            const figPattern = /Figure\s+(\d+)(?!:)/g;
            let figMatch: RegExpExecArray | null;
            while ((figMatch = figPattern.exec(lineStr)) !== null) {
              const figNum = figMatch[1];
              const matchStart = figMatch.index;
              const matchEnd = matchStart + `Figure ${figNum}`.length;
              const { bbox: provBBox } = item.prov[0];
              const scaledFigBBox = { l: provBBox.l * POINT_TO_PIXEL, r: provBBox.r * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - (pageHeights[highlightData.page] ?? DEFAULT_PAGE_HEIGHT) * lineHeightRel) * POINT_TO_PIXEL };
              const { left: figLeft, width: figWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledFigBBox);
              figureLinkList.push({
                page: highlightData.page, top: cssLineTopRel, left: figLeft, width: figWidth, height: lineHeightRel, figId: `fig-${figNum}`, text: `Figure ${figNum}`,
              });
            }
          });
        }
      }
    });

    (docData.groups ?? []).forEach((group: GroupItem) => {
      const highlightData = processItemBBox(group, group.label || 'group');
      // Logic for specific group types like lists for bibliography can remain
      if ((group.label === 'list' || group.label === 'ordered_list') && group.parent?.$ref === '#/body') {
        group.children?.forEach((refChild: RefItem) => {
          const refTextItem = docData.texts?.find(t => t.self_ref === refChild.$ref);
          if (refTextItem?.orig?.startsWith('[') && refTextItem.prov?.[0]?.bbox) {
            const match = refTextItem.orig.match(/^\[(\d+)\]/);
            if (match) {
              const refNum = match[1];
              const refBBox = refTextItem.prov[0].bbox;
              const pageIndex = (refTextItem.prov[0].page_no || 1) - 1;
              const pageHeight = pageHeights[pageIndex] ?? DEFAULT_PAGE_HEIGHT;
              const topPx = (pageHeight - refBBox.t) * POINT_TO_PIXEL; // This is absolute, might need adjustment if used for relative overlay
              const refId = `ref-${refNum}`;
              citationLinkList.push({
                page: pageIndex, top: topPx / pageHeight, left: (refBBox.l * POINT_TO_PIXEL) / (pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH), width: 1 / (pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH), height: 1 / pageHeight, refId: refId, text: `[${refNum}]`, isAnchor: true,
              });
              const fullRefText = refTextItem.orig.substring(match[0].length).trim();
              bibliography[refId] = fullRefText;
            }
          }
        });
      } else if (highlightData && group.content_layer !== "FURNITURE") { // Generic group, not furniture
        // Could add to a genericGroupHighlights if needed, or handle specific group types
      }
    });

    (docData.pictures ?? []).forEach((pic: PictureItem) => {
      const highlightData = processItemBBox(pic, 'picture');
      if (!highlightData) return;

      if (pic.content_layer !== "FURNITURE") {
        pictureList.push(highlightData); // Add to main picture list if not furniture

        if (Array.isArray(pic.captions) && pic.captions.length > 0) {
          const [firstCaption] = pic.captions;
          const captionTextItem = docData.texts?.find(t => t.self_ref === firstCaption.$ref);
          const capText = captionTextItem?.orig ?? '';
          const match = capText.match(/^Figure\s+(\d+)/);
          if (match) {
            const figNum = match[1];
            const figId = `fig-${figNum}`;
            figureCaptions[figId] = capText;
            figureLinkList.push({ ...highlightData, figId: figId, text: `Figure ${figNum}`, isAnchor: true });
          }
        }
      }
    });

    // Process Tables
    (docData.tables ?? []).forEach((table) => {
      const highlightData = processItemBBox(table, 'Table');
      if (highlightData && table.content_layer !== "FURNITURE") {
        tableHighlights.push(highlightData);
      }
    });

    // Process Formulas
    (docData.formulas ?? []).forEach((formula) => {
      const highlightData = processItemBBox(formula, 'Formula');
      if (highlightData && formula.content_layer !== "FURNITURE") {
        formulaHighlights.push(highlightData);
      }
    });

    // Process Codes
    (docData.codes ?? []).forEach((code) => {
      const highlightData = processItemBBox(code, 'Code');
      if (highlightData && code.content_layer !== "FURNITURE") {
        codeHighlights.push(highlightData);
      }
    });

    // Note: KeyValueItem and FormItem processing would follow the same pattern if they exist in docData.
    // For furniture, the processItemBBox function already adds items with content_layer === "FURNITURE"
    // to the furnitureHighlights list. We just need to ensure all relevant docData arrays are iterated
    // with processItemBBox if they can contain furniture (e.g. if a table can be furniture).
    // The current furniture check is within processItemBBox, which is called for texts, groups, pictures, tables, formulas, codes.

    return {
      tokenHighlights: tokenList,
      lineHighlights: lineList,
      paragraphHighlights: paragraphList,
      headerHighlights: headerList,
      titleHighlights: titleList,
      captionHighlights: captionList,
      footnoteHighlights: footnoteList,
      citationLinks: citationLinkList,
      figureLinks: figureLinkList,
      pictureHighlights: pictureList,
      bibliography: bibliography,
      figureCaptions: figureCaptions,
      tableHighlights,
      formulaHighlights,
      codeHighlights,
      furnitureHighlights,
    };
  }, [extractedTokens]);  // Only depend on extractedTokens, not toggles

  // Log overlay data for debugging
  // Updated console.log to include new highlight types
  console.log('Overlay data computed:', {
    tokens: overlayData.tokenHighlights.length,
    lines: overlayData.lineHighlights.length,
    paragraphs: overlayData.paragraphHighlights.length,
    headers: overlayData.headerHighlights.length,
    titles: overlayData.titleHighlights.length,
    captions: overlayData.captionHighlights.length,
    footnotes: overlayData.footnoteHighlights.length,
    citations: overlayData.citationLinks.length,
    figures: overlayData.figureLinks.length,
    pictures: overlayData.pictureHighlights.length,
    bibliographyEntries: Object.keys(overlayData.bibliography).length,
    figureCaptionEntries: Object.keys(overlayData.figureCaptions).length,
  });

  const handleToolbarToggle = useCallback((key: string) => {
    if (key in toggles) {
      toggleFeature(key as keyof typeof toggles);
    }
  }, [toggles, toggleFeature]);

  const handleToggleSelection = useCallback(() => {
    setSelectionMode((m) => !m);
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((fm) => !fm);
  }, []);

  return (
    <ContextProvider> 
      {/* Top toolbar with layer toggles and selection mode */}
      <Toolbar
        toggles={toggles}
        onToggle={handleToolbarToggle}
        selectionMode={selectionMode}
        onToggleSelection={handleToggleSelection}
        focusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
      />

      {/* Debug button to test sidebar - Commented out
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => setSelectedEntity({
            type: 'debug',
            label: 'Debug Test',
            content: 'This is a test to verify the sidebar is working',
            page: 1,
            coords: { top: 0, left: 0, width: 100, height: 20 }
          })}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Sidebar
        </button>
        <div className="text-xs mt-1 bg-gray-100 p-1 rounded">
          Tokens: {extractedTokens.length}<br/>
          Paragraphs: {overlayData.paragraphHighlights.length}<br/>
          Headers: {overlayData.headerHighlights.length}<br/>
        </div>
      </div>
      */}

      {/* Selection mode indicator */}
      <>
        {selectionMode && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Selection Mode Active</span>
              <span className="text-xs opacity-75">Draw a rectangle to select text</span>
            </div>
          </div>
        )}
      </>

      {/* Main responsive content area with proper layout */}
      <div className="pdf-viewer-content-area with-toolbar" style={{ marginTop: '96px' }}>
        {/* PDF Document viewer area - styles primarily from globals.css */}
        <div className="pdf-viewer-pdf-area" style={{ position: 'relative' }}>
          <DocumentWrapper 
            className="w-full max-w-full docling-document-wrapper"
            file={docData.origin?.uri ?? 'https://arxiv.org/pdf/2408.09869v3'} 
            renderType={RENDER_TYPE.MULTI_CANVAS}
          >
            {/* Token extractor component */}
            <TokenExtractor onTokensExtracted={handleTokensExtracted} />
            
            {/* Render pages */}
            <Pages
              toggles={toggles}
              tokenHighlights={overlayData.tokenHighlights}
              lineHighlights={overlayData.lineHighlights}
              paragraphHighlights={overlayData.paragraphHighlights}
              headerHighlights={overlayData.headerHighlights}
              titleHighlights={overlayData.titleHighlights}
              captionHighlights={overlayData.captionHighlights}
              footnoteHighlights={overlayData.footnoteHighlights}
              citationLinks={overlayData.citationLinks}
              figureLinks={overlayData.figureLinks}
              pictureHighlights={overlayData.pictureHighlights}
              bibliography={overlayData.bibliography}
              figureCaptions={overlayData.figureCaptions}
              tableHighlights={overlayData.tableHighlights}
              formulaHighlights={overlayData.formulaHighlights}
              codeHighlights={overlayData.codeHighlights}
              furnitureHighlights={overlayData.furnitureHighlights}
              selectionMode={selectionMode}
              isFocusMode={isFocusMode}
              selectedEntity={selectedEntity}
              onEntitySelect={handleEntitySelect}
            />
          </DocumentWrapper>
        </div>

        {/* Sidebar inspector area */}
        <>
          {selectedEntity && (
            <div className="pdf-viewer-sidebar">
              <InspectorSidebar entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
            </div>
          )}
        </>
      </div>
    </ContextProvider>
  );
};

export default PDFViewerDemoWithDocling;
