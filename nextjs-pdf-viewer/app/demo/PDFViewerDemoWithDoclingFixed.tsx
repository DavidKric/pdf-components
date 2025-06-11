'use client';

import React, { useMemo, useState } from 'react';
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

  // Toggle function for overlay feature buttons
  const toggleFeature = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    // If toggling tokens off, also clear any token selection
    if (key === 'tokens' && toggles.tokens) {
      setSelectedEntity(null);
    }
  };

  // Callback when an overlay annotation is clicked – capture its data for the inspector
  const handleEntitySelect = (entity: SelectedEntity | null) => {
    setSelectedEntity(entity);
  };

  // Precompute all overlay bounding boxes from the DoclingDocument.
  // This mirrors PaperMage's processing: map Docling items to tokens, lines, paragraphs, etc.
  const {
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
  } = useMemo(() => {
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
    const POINT_TO_PIXEL = 1; // keep points for now since we move to relative, scaling not needed yet
    const tokenList: Array<{ page: number; top: number; left: number; width: number; height: number; text: string }> = [];
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
    // Iterate over all text-based items in the Docling document
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
      const pageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;
      const elemHeight = pdfTop - pdfBottom;
      const elemWidth = pdfRight - pdfLeft;
      // Convert PDF coordinate (origin bottom-left) to CSS coordinate (origin top-left):
      const top = (pageHeight - pdfTop) * POINT_TO_PIXEL;
      const left = pdfLeft * POINT_TO_PIXEL;
      const width = elemWidth * POINT_TO_PIXEL;
      const height = elemHeight * POINT_TO_PIXEL;

      // Identify and record high-level elements by label:
      if (item.label === 'text' && itemText) {
        // Consider a 'text' item a paragraph if it's long (heuristic: >100 chars)
        if (itemText.length > 100) {
          paragraphList.push({ page: pageIndex, top, left, width, height, text: itemText });
        }
      }
      if (item.label === 'section_header' && itemText) {
        headerList.push({ page: pageIndex, top, left, width, height, text: itemText });
      }
      if (item.label === 'title' && itemText) {
        titleList.push({ page: pageIndex, top, left, width, height, text: itemText });
      }
      if (item.label === 'caption' && itemText) {
        captionList.push({ page: pageIndex, top, left, width, height, text: itemText });
      }
      if (item.label === 'footnote' && itemText) {
        footnoteList.push({ page: pageIndex, top, left, width, height, text: itemText });
      }

      // If the item has actual text content, further break it down into line and token overlays
      if (itemText) {
        const lines = itemText.split('\n');
        const lineHeight = lines.length > 1 ? height / lines.length : height;
        lines.forEach((lineStr: string, lineIdx: number) => {
          // Compute each line's bounding box (assuming equal line height for simplicity)
          const lineTopPDF = pdfTop - lineIdx * lineHeight;
          const lineBBox = { l: pdfLeft, r: pdfRight, t: lineTopPDF, b: lineTopPDF - lineHeight };
          const cssLineTop = (pageHeight - lineTopPDF) * POINT_TO_PIXEL;
          // Record line overlay
          lineList.push({
            page: pageIndex,
            top: cssLineTop,
            left: pdfLeft * POINT_TO_PIXEL,
            width: (pdfRight - pdfLeft) * POINT_TO_PIXEL,
            height: lineHeight * POINT_TO_PIXEL,
            text: lineStr,
          });
          // Split line into tokens separated by whitespace
          const tokens = lineStr.trim().split(/\s+/).filter(tok => tok.length > 0);
          let charCount = 0;
          tokens.forEach(tokenText => {
            const tokenLen = tokenText.replace(/ /g, '').length;
            const startIdx = charCount;
            const endIdx = charCount + tokenLen;
            charCount += tokenLen;
            // Compute token bounding box within the line
            const scaledBBox = { l: pdfLeft * POINT_TO_PIXEL, r: pdfRight * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - lineHeight) * POINT_TO_PIXEL };
            const { left: tokenLeft, width: tokenWidth } = computeSegmentPosition(lineStr, startIdx, endIdx, scaledBBox);
            tokenList.push({
              page: pageIndex,
              top: cssLineTop,
              left: tokenLeft,
              width: tokenWidth,
              height: lineHeight,
              text: tokenText,
            });
          });
          // Find citation references like "[12]" in the line
          const citationPattern = /\[(\d+(?:[\-,]\s*\d+)*)\]/g;
          let citeMatch: RegExpExecArray | null;
          while ((citeMatch = citationPattern.exec(lineStr)) !== null) {
            const matchText = citeMatch[0];            // e.g., "[12]" or "[1-3]"
            const matchStart = citeMatch.index;
            const matchEnd = matchStart + matchText.length;
            const scaledCiteBBox = { l: pdfLeft * POINT_TO_PIXEL, r: pdfRight * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - lineHeight) * POINT_TO_PIXEL };
            const { left: citeLeft, width: citeWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledCiteBBox);
            // Use the first number in the bracket as the ref target (for simplicity)
            const targetNum = citeMatch[1].split(/[\-,]/)[0].trim();
            const relCiteBox = absoluteToRelativeBox(
              {
                page: pageIndex,
                top: cssLineTop,
                left: citeLeft,
                width: citeWidth,
                height: lineHeight,
              },
              pageWidth * POINT_TO_PIXEL,
              pageHeight * POINT_TO_PIXEL
            );
            citationLinkList.push({ ...relCiteBox, refId: `ref-${targetNum}`, text: matchText });
          }
          // Find figure references like "Figure 3" (without trailing colon to exclude captions)
          const figPattern = /Figure\s+(\d+)(?!:)/g;
          let figMatch: RegExpExecArray | null;
          while ((figMatch = figPattern.exec(lineStr)) !== null) {
            const figNum = figMatch[1];
            const matchStart = figMatch.index;
            const matchEnd = matchStart + `Figure ${figNum}`.length;
            const scaledFigBBox = { l: pdfLeft * POINT_TO_PIXEL, r: pdfRight * POINT_TO_PIXEL, t: lineTopPDF * POINT_TO_PIXEL, b: (lineTopPDF - lineHeight) * POINT_TO_PIXEL };
            const { left: figLeft, width: figWidth } = computeSegmentPosition(lineStr, matchStart, matchEnd, scaledFigBBox);
            const relFigRefBox = absoluteToRelativeBox(
              {
                page: pageIndex,
                top: cssLineTop,
                left: figLeft,
                width: figWidth,
                height: lineHeight,
              },
              pageWidth * POINT_TO_PIXEL,
              pageHeight * POINT_TO_PIXEL
            );
            figureLinkList.push({ ...relFigRefBox, figId: `fig-${figNum}`, text: `Figure ${figNum}` });
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
              const pageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;
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
      const pageWidth = pageWidths[pageIndex] ?? DEFAULT_PAGE_WIDTH;

      if (Array.isArray(pic.captions) && pic.captions.length > 0) {
        const [firstCaption] = pic.captions;  // safe: we just checked length
        const captionTextItem = docData.texts?.find(
          t => t.self_ref === firstCaption.$ref
        );
        const capText = captionTextItem?.orig ?? '';
        const match = capText.match(/^Figure\s+(\d+)/);
        if (match) {
          const figNum = match[1];
          figureLinkList.push({
            page: pageIndex,
            top: (pageHeight - picBBox.t) * POINT_TO_PIXEL,
            left: picBBox.l * POINT_TO_PIXEL,
            width: (picBBox.r - picBBox.l) * POINT_TO_PIXEL,
            height: (picBBox.t - picBBox.b) * POINT_TO_PIXEL,
            figId: `fig-${figNum}`,
            text: `Figure ${figNum}`,
            isAnchor: true,
          });
        }
      }
      // Record picture highlight (full image bbox)
      const absPicBox = {
        page: pageIndex,
        top: (pageHeight - picBBox.t) * POINT_TO_PIXEL,
        left: picBBox.l * POINT_TO_PIXEL,
        width: (picBBox.r - picBBox.l) * POINT_TO_PIXEL,
        height: (picBBox.t - picBBox.b) * POINT_TO_PIXEL,
      };
      pictureList.push(
        absoluteToRelativeBox(absPicBox, pageWidth * POINT_TO_PIXEL, pageHeight * POINT_TO_PIXEL)
      );
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
  }, []);  // compute once since docData is static

  // Pages component declared AFTER overlay arrays to capture them in closure
  const Pages: React.FC = () => {
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
              onEntitySelect={handleEntitySelect}
              onRegionSelect={handleEntitySelect}
            />
          </PageWrapper>
        ))}
      </>
    );
  };

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

      {/* Main content area: PDF viewer and optional inspector sidebar */}
      <div className="pdf-viewer-container flex relative" style={{ marginTop: '96px' }}>
        {/* PDF Document viewer with overlays */}
        <DocumentWrapper 
          className="flex-1" 
          file={docData.origin?.uri ?? 'https://arxiv.org/pdf/2408.09869v3'} 
          renderType={RENDER_TYPE.MULTI_CANVAS}
        >
          {/* Render pages first */}
          <Pages />
        </DocumentWrapper>

        {/* Sidebar inspector, shows when an entity is selected */}
        <InspectorSidebar entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
      </div>
    </ContextProvider>
  );
};

export default PDFViewerDemoWithDocling;
