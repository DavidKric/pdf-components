'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  DocumentContext,
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
      if (item.str && item.str.trim()) {
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
      }
    });
  }
  
  return allTokens;
}

// Component to extract tokens using DocumentContext
const TokenExtractor: React.FC<{ onTokensExtracted: (tokens: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }>) => void }> = ({ onTokensExtracted }) => {
  const { pdfDocProxy } = React.useContext(DocumentContext);

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
  onEntitySelect,
}) => {
  const { numPages } = React.useContext(DocumentContext);
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
    // Additional overlays like skimming highlights can be added here if needed
  });
  // State for selection mode (drag-to-select tool)
  const [selectionMode, setSelectionMode] = useState(false);
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
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    // If toggling tokens off, also clear any token selection
    if (key === 'tokens' && toggles.tokens) {
      setSelectedEntity(null);
    }
  }, [toggles.tokens]);

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
    const DEFAULT_PAGE_HEIGHT = pageHeights[0] ?? 792;
    const DEFAULT_PAGE_WIDTH = pageWidths[0] ?? 612;
    const POINT_TO_PIXEL = 96 / 72; // pdf points (1/72 in) to CSS px at 96 DPI
    
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
    (docData.texts ?? []).forEach((item: any) => {
      // Process any item that has a bbox and textual content – not only 'text' but also
      // 'section_header', 'title', 'caption', 'footnote', etc.
      // (We still skip non-textual items like drawings unless they have a label we care about.)
      const allowedLabels = ['text', 'section_header', 'title', 'caption', 'footnote', 'list_item'];
      if (!allowedLabels.includes(item.label)) return;
      const { text: itemText, prov } = item;
      if (!prov?.[0]?.bbox) return;  // skip if no bounding box
      const bbox = prov[0].bbox;
      const pageIndex = (prov[0].page_no || 1) - 1;  // Docling pages are 1-indexed
      const { t: pdfTop, b: pdfBottom, l: pdfLeft, r: pdfRight } = bbox;
      // Use page-specific height when flipping the vertical axis
      const pageHeight = pageHeights[pageIndex] ?? DEFAULT_PAGE_HEIGHT;
      const pdfPageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;
      const elemHeight = pdfTop - pdfBottom;
      const elemWidth = pdfRight - pdfLeft;
      // Relative coordinates (origin top-left)
      const topRel = (pageHeight - pdfTop) / pageHeight;
      const leftRel = pdfLeft / pdfPageWidth;
      const widthRel = elemWidth / pdfPageWidth;
      const heightRel = elemHeight / pageHeight;

      // Identify and record high-level elements by label:
      if (item.label === 'text' && itemText) {
        // Consider a 'text' item a paragraph if it's long (heuristic: >100 chars)
        if (itemText.length > 100) {
          paragraphList.push({ page: pageIndex, top: topRel, left: leftRel, width: widthRel, height: heightRel, text: itemText });
        }
      }
      if (item.label === 'section_header' && itemText) {
        headerList.push({ page: pageIndex, top: topRel, left: leftRel, width: widthRel, height: heightRel, text: itemText });
      }
      if (item.label === 'title' && itemText) {
        titleList.push({ page: pageIndex, top: topRel, left: leftRel, width: widthRel, height: heightRel, text: itemText });
      }
      if (item.label === 'caption' && itemText) {
        captionList.push({ page: pageIndex, top: topRel, left: leftRel, width: widthRel, height: heightRel, text: itemText });
      }
      if (item.label === 'footnote' && itemText) {
        footnoteList.push({ page: pageIndex, top: topRel, left: leftRel, width: widthRel, height: heightRel, text: itemText });
      }

      // If the item has actual text content, further break it down into line overlays (but not tokens - we get those from PDF.js)
      if (itemText) {
        const lines = itemText.split('\n');
        const lineHeightRel = lines.length > 1 ? heightRel / lines.length : heightRel;
        lines.forEach((lineStr: string, lineIdx: number) => {
          // Compute each line's bounding box (assuming equal line height for simplicity)
          const lineTopPDF = pdfTop - lineIdx * elemHeight / lines.length;
          const cssLineTopRel = topRel + lineIdx * lineHeightRel;
          // Record line overlay
          lineList.push({
            page: pageIndex,
            top: cssLineTopRel,
            left: leftRel,
            width: widthRel,
            height: lineHeightRel,
            text: lineStr,
          });

          // Find citation references like "[12]" in the line
          const citationPattern = /\[(\d+(?:[\-,]\s*\d+)*)\]/g;
          let citeMatch: RegExpExecArray | null;
          while ((citeMatch = citationPattern.exec(lineStr)) !== null) {
            const matchText = citeMatch[0];            // e.g., "[12]" or "[1-3]"
            const matchStart = citeMatch.index;
            const matchEnd = matchStart + matchText.length;
            const scaledCiteBBox = { l: pdfLeft * POINT_TO_PIXEL, r: pdfRight * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - elemHeight) * POINT_TO_PIXEL };
            const { left: citeLeft, width: citeWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledCiteBBox);
            // Use the first number in the bracket as the ref target (for simplicity)
            const targetNum = citeMatch[1].split(/[\-,]/)[0].trim();
            citationLinkList.push({
              page: pageIndex,
              top: cssLineTopRel,
              left: citeLeft,
              width: citeWidth,
              height: lineHeightRel,
              refId: `ref-${targetNum}`,
              text: matchText,
            });
          }
          // Find figure references like "Figure 3" (without trailing colon to exclude captions)
          const figPattern = /Figure\s+(\d+)(?!:)/g;
          let figMatch: RegExpExecArray | null;
          while ((figMatch = figPattern.exec(lineStr)) !== null) {
            const figNum = figMatch[1];
            const matchStart = figMatch.index;
            const matchEnd = matchStart + `Figure ${figNum}`.length;
            const scaledFigBBox = { l: pdfLeft * POINT_TO_PIXEL, r: pdfRight * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - elemHeight) * POINT_TO_PIXEL };
            const { left: figLeft, width: figWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledFigBBox);
            figureLinkList.push({
              page: pageIndex,
              top: cssLineTopRel,
              left: figLeft,
              width: figWidth,
              height: lineHeightRel,
              figId: `fig-${figNum}`,
              text: `Figure ${figNum}`,
            });
          }
        });
      }
    });

    // Process groups and pictures to mark reference list items (anchors for citations) and figures:
    (docData.groups ?? []).forEach((group: GroupItem) => {
      // Identify reference list entries (e.g., bibliography items) – label might be "list" of references
      if ((group.label === 'list' || group.label === 'ordered_list') && group.parent?.$ref === '#/body') {
        group.children?.forEach((refChild: RefItem) => {
          const refTextItem = docData.texts?.find(t => t.self_ref === refChild.$ref);
          if (refTextItem?.orig?.startsWith('[') && refTextItem.prov?.[0]?.bbox) {
            // This text item is a reference list entry starting with "[n]"
            const match = refTextItem.orig.match(/^\[(\d+)\]/);
            if (match) {
              const refNum = match[1];
              const refBBox = refTextItem.prov[0].bbox;
              const pageIndex = (refTextItem.prov[0].page_no || 1) - 1;
              const pageHeight = pageHeights[pageIndex] ?? DEFAULT_PAGE_HEIGHT;
              const topPx = (pageHeight - refBBox.t) * POINT_TO_PIXEL;
              citationLinkList.push({
                page: pageIndex,
                top: topPx,
                left: refBBox.l * POINT_TO_PIXEL,
                width: 1,
                height: 1,
                refId: `ref-${refNum}`,
                text: `[${refNum}]`,
                isAnchor: true,  // mark as anchor target (not clickable)
              });
            }
          }
        });
      }
    });
    (docData.pictures ?? []).forEach((pic: PictureItem) => {
      if (!pic.prov?.[0]?.bbox) return;
      const picBBox = pic.prov[0].bbox;
      const pageIndex = (pic.prov[0].page_no ?? 1) - 1;
      const pageHeight = pageHeights[pageIndex] ?? DEFAULT_PAGE_HEIGHT;
      const pdfPageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;

      if (Array.isArray(pic.captions) && pic.captions.length > 0) {
        const [firstCaption] = pic.captions;  // safe: we just checked length
        const captionTextItem = docData.texts?.find(
          t => t.self_ref === firstCaption.$ref
        );
        const capText = captionTextItem?.orig ?? '';
        const match = capText.match(/^Figure\s+(\d+)/);
        if (match) {
          const figNum = match[1];
          const picTopRel = (pageHeight - picBBox.t) / pageHeight;
          const picLeftRel = picBBox.l / pdfPageWidth;
          const picWidthRel = (picBBox.r - picBBox.l) / pdfPageWidth;
          const picHeightRel = (picBBox.t - picBBox.b) / pageHeight;
          figureLinkList.push({
            page: pageIndex,
            top: picTopRel,
            left: picLeftRel,
            width: picWidthRel,
            height: picHeightRel,
            figId: `fig-${figNum}`,
            text: `Figure ${figNum}`,
            isAnchor: true,
          });
          // image highlight rectangle
          pictureList.push({
            page: pageIndex,
            top: picTopRel,
            left: picLeftRel,
            width: picWidthRel,
            height: picHeightRel,
          });
        }
      }
      // Record picture highlight (full image bbox)
      const picTopRel = (pageHeight - picBBox.t) / pageHeight;
      const picLeftRel = picBBox.l / pdfPageWidth;
      const picWidthRel = (picBBox.r - picBBox.l) / pdfPageWidth;
      const picHeightRel = (picBBox.t - picBBox.b) / pageHeight;
      pictureList.push({
        page: pageIndex,
        top: picTopRel,
        left: picLeftRel,
        width: picWidthRel,
        height: picHeightRel,
      });
    });

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
    };
  }, [extractedTokens]);  // Only depend on extractedTokens, not toggles

  // Log overlay data for debugging
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
  });

  return (
    <ContextProvider> 
      {/* Top toolbar with layer toggles and selection mode */}
      <Toolbar
        toggles={toggles}
        /*
         * Toolbar expects `onToggle` to accept a `string`, but our
         * `toggleFeature` handler is typed more narrowly.  A small
         * wrapper satisfies Toolbar's contract while preserving
         * type-safety inside `toggleFeature`.
         */
        onToggle={(key) => {
          if (key in toggles) {
            toggleFeature(key as keyof typeof toggles);
          }
        }}
        selectionMode={selectionMode}
        onToggleSelection={() => setSelectionMode((m) => !m)}
      />

      {/* Debug button to test sidebar */}
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
          Headers: {overlayData.headerHighlights.length}
        </div>
      </div>

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

      {/* Main content area: PDF viewer and optional inspector sidebar */}
      <div className="pdf-viewer-container flex relative" style={{ marginTop: '96px' }}>
        {/* PDF Document viewer with overlays */}
        <DocumentWrapper 
          className={selectedEntity ? "flex-1 pr-4" : "flex-1"} 
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
            selectionMode={selectionMode}
            onEntitySelect={handleEntitySelect}
          />
        </DocumentWrapper>

        {/* Sidebar inspector, shows when an entity is selected */}
        <>
          {selectedEntity && (
            <InspectorSidebar entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
          )}
        </>
      </div>
    </ContextProvider>
  );
};

export default PDFViewerDemoWithDocling;
