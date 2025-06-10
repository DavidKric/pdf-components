'use client';

import React, { useContext, useState, useMemo } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  UiContext,
  TransformContext,
  RENDER_TYPE,
  Overlay,
  BoundingBox,
  scrollToId,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';

import type {
  DoclingDocument,
  TextItem,
  GroupItem,
  RefItem,
  PictureItem,
  BoundingBox as DoclingBBox,
} from '@docling/docling-core';

// -------- data --------------------------------------------------------------
import rawJson from './2408.09869v3.json';
const docData = rawJson as DoclingDocument; // typed document
const PDF_URL = 'https://arxiv.org/pdf/2408.09869v3';

// ---------------------------------------------------------------------------
// Utility types for internal overlay data
type Box = { page: number; top: number; left: number; width: number; height: number };
type TextBox = Box & { text: string, colorClass?: string };
type TokenBox = Box & { text: string };
type LinkBox = Box & { refId?: string; figId?: string; isAnchor?: boolean };

// Predefined color classes or styles for highlights
const COLORS: { [key: string]: string } = {
  token: 'bg-green-200 bg-opacity-10 border border-green-500',            // tokens: light green
  line: 'bg-orange-200 bg-opacity-20 border border-orange-400',           // rows: light orange
  paragraph: 'bg-yellow-300 bg-opacity-15 border border-yellow-500',      // paragraphs: light yellow
  sectionHeader: 'bg-red-200 bg-opacity-25 border border-red-500',        // section headers: light red
  title: 'bg-teal-200 bg-opacity-20 border border-teal-600',              // title: light teal
  caption: 'bg-pink-200 bg-opacity-20 border border-pink-500',            // captions: light pink
  footnote: 'bg-purple-300 bg-opacity-20 border border-purple-600',       // footnotes: light purple
  abstract: 'bg-blue-200 bg-opacity-20 border border-blue-500',           // abstract: light blue
  skimming: 'bg-yellow-200 bg-opacity-50 border-2 border-yellow-600',     // skimming highlight: bright yellow
};
// Color palette for multiple authors (each author gets a different color)
const authorColorClasses: string[] = [
  'bg-blue-200 bg-opacity-50 border border-blue-400',
  'bg-green-200 bg-opacity-50 border border-green-400',
  'bg-orange-200 bg-opacity-50 border border-orange-400',
  'bg-purple-200 bg-opacity-50 border border-purple-400',
  'bg-teal-200 bg-opacity-50 border border-teal-400',
  'bg-pink-200 bg-opacity-50 border border-pink-400',
];

// Compute relative segment position within a line's bounding box
const computeSegmentPosition = (
  lineText: string,
  segStart: number,
  segEnd: number,
  lineBBox: DoclingBBox
) => {
  const textNoSpace = lineText.replace(/ /g, '');
  const totalLen = textNoSpace.length || 1;
  const prefixLen = lineText.slice(0, segStart).replace(/ /g, '').length;
  const segmentLen = lineText.slice(segStart, segEnd).replace(/ /g, '').length;
  const { l: lineLeft, r: lineRight } = lineBBox;
  const ratioStart = prefixLen / totalLen;
  const ratioEnd = (prefixLen + segmentLen) / totalLen;
  const left = lineLeft + ratioStart * (lineRight - lineLeft);
  const width = (ratioEnd - ratioStart) * (lineRight - lineLeft);
  return { left, width };
};

const typeLabels: Record<string, string> = {
  tokens: 'Token',
  rows: 'Row',
  paragraphs: 'Paragraph',
  sectionHeaders: 'Section Header',
  titles: 'Title',
  authors: 'Author',
  abstract: 'Abstract',
  captions: 'Caption',
  footnotes: 'Footnote',
  skimming: 'Skimming Highlight',
};

// ──────────────────────────────────────────────────────────────
// ADD THE TWO SHARED TYPES **right below** the array above
type FeatureToggles = {
  tokens: boolean;
  rows: boolean;
  paragraphs: boolean;
  sectionHeaders: boolean;
  titles: boolean;
  authors: boolean;
  abstract: boolean;
  captions: boolean;
  footnotes: boolean;
  skimming: boolean;
};

type SelectionItem = { type: string; data: TextBox | TokenBox | Box | null } | undefined;
// ──────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Overlay adapter from PaperMage mapping (generated in papermageAdapter.ts)
import type { OverlayData } from './papermageAdapter';
import { extractOverlayData } from './papermageAdapter';

// Zoom widget from PaperMage
import { SimpleZoomControl } from './papermage-components/SimpleZoomControl';
import { AuthorDragOverlay, DragBox } from './papermage-components/AuthorDragOverlay';
import { TextHighlightGroup } from './papermage-components/TextHighlightGroup';

// ---------------------------------------------------------------------------
// Main component
const PDFViewerDemoWithDocling: React.FC = () => {
  // feature toggles
  const [toggles, setToggles] = useState<FeatureToggles>({
    tokens: false,
    rows: false,
    paragraphs: false,
    sectionHeaders: false,
    titles: false,
    authors: false,
    abstract: false,
    captions: false,
    footnotes: false,
    skimming: false,
  });
  const [selectedItem, setSelectedItem] = useState<SelectionItem>(undefined);

  const toggleFeature = (key: keyof FeatureToggles) => {
    setToggles(prev => {
      const newValue = !prev[key];
      const newToggles = { ...prev, [key]: newValue };
      // Clear selection if its type is being turned off
      if (!newValue && selectedItem && typeLabels[key] === selectedItem.type) {
        setSelectedItem({ type: '', data: null });
      }
      return newToggles;
    });
  };

  return (
    <ContextProvider>
      {/* Top control bar */}
      <div className="fixed top-12 left-0 right-0 h-12 bg-gray-800 text-gray-100 flex items-center px-4 z-40 shadow justify-between">
        <span className="font-bold text-sm text-yellow-400 mr-4">Semantic Reader + PaperMage Demo</span>
        <div>
          {([
            ['tokens', 'Tokens'],
            ['rows', 'Rows'],
            ['paragraphs', 'Paragraphs'],
            ['sectionHeaders', 'Section Headers'],
            ['titles', 'Titles'],
            ['authors', 'Authors'],
            ['abstract', 'Abstract'],
            ['captions', 'Captions'],
            ['footnotes', 'Footnotes'],
            ['skimming', 'Skimming Highlights'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              className={`${
                toggles[key] ? 'bg-gray-700 text-yellow-300' : 'bg-gray-800 hover:bg-gray-700'
              } px-2 py-1 mr-1 rounded text-xs`}
              onClick={() => toggleFeature(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Zoom control on far right */}
        <SimpleZoomControl />
      </div>

      {/* Main content area: left JSON panel + PDF viewer */}
      <div className="relative flex" style={{ marginTop: '96px' }}>
        {/* JSON inspection panel */}
        <div className="w-80 h-[calc(100vh-96px)] overflow-y-auto bg-gray-50 border-r border-gray-300 p-3 text-xs">
          {selectedItem ? (
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(
                {
                  type: selectedItem.type,
                  page: ((selectedItem.data as Box)?.page ?? 0) + 1,
                  text: (selectedItem.data as TextBox)?.text ?? '',
                  bbox: {
                    left: (selectedItem.data as Box).left.toFixed(2),
                    top: (selectedItem.data as Box).top.toFixed(2),
                    width: (selectedItem.data as Box).width.toFixed(2),
                    height: (selectedItem.data as Box).height.toFixed(2),
                  },
                },
                null,
                2,
              )}
            </pre>
          ) : (
            <p className="text-gray-600 font-medium">Select a highlighted region to inspect its data.</p>
          )}
        </div>

        {/* PDF Viewer container */}
        <div className="pdf-viewer-container relative flex-1">
          <DocumentWrapper file={PDF_URL} renderType={RENDER_TYPE.SINGLE_CANVAS}>
            <PDFContent toggles={toggles} setSelectedItem={setSelectedItem} />
          </DocumentWrapper>
        </div>
      </div>
    </ContextProvider>
  );
};

// Inner content component that renders overlays
const PDFContent: React.FC<{
  toggles: FeatureToggles;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectionItem>>;
}> = ({ toggles, setSelectedItem }) => {
  const { numPages, pageDimensions } = useContext(DocumentContext);
  const { errorMessage, isLoading } = useContext(UiContext);
  const { scale } = useContext(TransformContext);

  // Precompute overlay data using generic adapter (plus authors/abstract extras)
  const {
    tokenBoxes,
    lineBoxes,
    paragraphBoxes,
    headerBoxes,
    titleBoxes,
    captionBoxes,
    footnoteBoxes,
    citationLinks,
    figureLinks,
  }: OverlayData = useMemo(() => extractOverlayData(docData), []);

  // Keep specialised author & abstract highlights (not part of generic adapter)
  const { authorsBoxes, abstractBoxes } = useMemo(() => {
    if (!pageDimensions) return { authorsBoxes: [], abstractBoxes: [] };

    const authorsList: TextBox[] = [];
    const abstractList: TextBox[] = [];
    const pageHeight = pageDimensions?.height ?? 792;
    let inAuthorsBlock = false;
    let inAbstract = false;
    let authorColorIndex = 0;

    docData.texts?.forEach(item => {
      const { label, prov, text: itemText } = item;
      if (!prov?.length || !prov[0].bbox || !itemText) return;

      const bbox = prov[0].bbox;
      const pageIdx = prov[0].page_no - 1;
      const { t: topY, b: bottomY, l: leftX, r: rightX } = bbox;
      const elemHeight = topY - bottomY;
      const elemWidth  = rightX - leftX;

      // Detect boundaries (title already processed by adapter)
      if (label === 'title') {
        inAuthorsBlock = true;
      }
      if (label === 'section_header') {
        const textLower = (itemText || '').trim().toLowerCase();
        if (textLower.startsWith('abstract')) {
          inAbstract = true;
          inAuthorsBlock = false;
        } else if (inAuthorsBlock && !inAbstract) {
          // first non-abstract section header ends author block
          inAuthorsBlock = false;
        }
      }

      // Collect abstract block lines
      if (inAbstract && label === 'text') {
        abstractList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
          text: itemText,
        });
      }

      // Author names parsing (first page, within author block)
      if (inAuthorsBlock && label === 'text' && pageIdx === 0) {
        const lines = itemText.split('\n');
        const lineHeight = lines.length > 1 ? elemHeight / lines.length : elemHeight;
        lines.forEach((lineText, lineIndex) => {
          const lowerLine = lineText.trim().toLowerCase();
          const likelyAffiliation =
            lowerLine.includes('@') ||
            lowerLine.includes('university') ||
            lowerLine.includes('institute') ||
            lowerLine.includes('department') ||
            lowerLine.includes('college') ||
            lowerLine.includes('school');
          const startsWithNum = /^[0-9]/.test(lowerLine);
          if (lineText.trim() !== '' && !likelyAffiliation && !startsWithNum) {
            const nameSegments = lineText.replace(/\sand\s/gi, ', ').split(',').map(seg => seg.trim()).filter(Boolean);
            const lineTopY = topY - lineIndex * lineHeight;
            const lineBBox: DoclingBBox = { l: leftX, r: rightX, t: lineTopY, b: lineTopY - lineHeight };

            nameSegments.forEach(name => {
              const cleanName = name.replace(/[\d\*\†]+$/g, '').trim();
              if (!cleanName) return;
              const startIdx = lineText.indexOf(name);
              if (startIdx < 0) return;
              const endIdx = startIdx + name.length;
              const { left: segLeft, width: segWidth } = computeSegmentPosition(lineText, startIdx, endIdx, lineBBox);
              const colorClass = authorColorClasses[authorColorIndex % authorColorClasses.length];
              authorColorIndex++;
              authorsList.push({
                page: pageIdx,
                top: pageHeight - lineTopY,
                left: segLeft,
                width: segWidth,
                height: lineHeight,
                text: cleanName,
                colorClass,
              });
            });
          }
        });
      }
    });

    return { authorsBoxes: authorsList, abstractBoxes: abstractList };
  }, [pageDimensions]);

  // Build highlight groups for paragraphs (each paragraph = 1 group)
  const paragraphHighlightGroups = useMemo(() => paragraphBoxes.map(p => [p]), [paragraphBoxes]);

  // Debug logging for PDF load status
  useMemo(() => {
    if (numPages === 0) {
      console.log('PDF not loaded yet...');
    } else {
      console.log(`PDF loaded: ${numPages} pages`);
    }
    if (errorMessage) {
      console.error('PDF Loading Error:', errorMessage);
    }
  }, [numPages, errorMessage]);

  // Track whether Alt / Option is pressed for marquee selection
  const [altDown, setAltDown] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.altKey && setAltDown(true);
    const onKeyUp = (e: KeyboardEvent) => !e.altKey && setAltDown(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <>
      {/* Error message banner */}
      {errorMessage && (
        <div className="fixed top-12 left-0 right-0 bg-red-600 text-white p-3 z-50">
          <strong>PDF Loading Error:</strong> {errorMessage}
        </div>
      )}
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-12 left-0 right-0 bg-blue-600 text-white p-3 z-50">
          Loading PDF...
        </div>
      )}

      <div className="pdf-reader__page-list">
        {Array.from({ length: numPages ?? 0 }).map((_, pageIndex) => (
          <PageWrapper key={pageIndex} pageIndex={pageIndex} renderType={RENDER_TYPE.SINGLE_CANVAS}>
            <>
              {/* Alt-drag marquee overlay (renders only when altDown) */}
              <AuthorDragOverlay
                pageIndex={pageIndex}
                altDown={altDown}
                createBlock={(box: DragBox) => {
                  setSelectedItem({ type: 'Marquee', data: { ...box } as any });
                }}
              />

              {/* Citation reference highlights */}
              <Overlay>
                <>
                  {citationLinks.filter((c: LinkBox) => c.page === pageIndex && !c.isAnchor).map((c: LinkBox, i: number) => (
                    <div
                      key={`cite-${pageIndex}-${i}`}
                      onClick={() => scrollToId(c.refId!)}
                      style={{ position: 'absolute', top: c.top, left: c.left, width: c.width, height: c.height }}
                      className="bg-blue-100 bg-opacity-50 border border-blue-500 cursor-pointer"
                      title={`Go to reference ${c.refId!.replace('ref-', '')}`}
                    />
                  ))}
                  {citationLinks.filter((c: LinkBox) => c.page === pageIndex && c.isAnchor).map((c: LinkBox, i: number) => (
                    <div
                      key={`citeAnchor-${pageIndex}-${i}`}
                      id={c.refId}
                      style={{
                        position: 'absolute',
                        top: c.top,
                        left: c.left,
                        width: c.width,
                        height: c.height,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              </Overlay>

              {/* Figure reference highlights */}
              <Overlay>
                <>
                  {figureLinks.filter((f: LinkBox) => f.page === pageIndex && !f.isAnchor).map((f: LinkBox, i: number) => (
                    <div
                      key={`figlink-${pageIndex}-${i}`}
                      onClick={() => scrollToId(f.figId!)}
                      style={{ position: 'absolute', top: f.top, left: f.left, width: f.width, height: f.height }}
                      className="bg-purple-100 bg-opacity-50 border border-purple-500 cursor-pointer"
                      title={`View Figure ${f.figId!.replace('fig-', '')}`}
                    />
                  ))}
                  {figureLinks.filter((f: LinkBox) => f.page === pageIndex && f.isAnchor).map((f: LinkBox, i: number) => (
                    <div
                      key={`figAnchor-${pageIndex}-${i}`}
                      id={f.figId}
                      style={{
                        position: 'absolute',
                        top: f.top,
                        left: f.left,
                        width: f.width,
                        height: f.height,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              </Overlay>

              {/* Token highlights */}
              {toggles.tokens && (
                <Overlay>
                  <>
                    {tokenBoxes.filter(t => t.page === pageIndex).map((token, i) => (
                      <BoundingBox
                        key={`token-${pageIndex}-${i}`}
                        className={`pdf-reader__overlay-bounding-box-highlighted ${COLORS.token}`}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={token.top * scale}
                        left={token.left * scale}
                        width={token.width * scale}
                        height={token.height * scale}
                        onClick={() => setSelectedItem({ type: 'Token', data: token })}
                        voiceOverLabel={`Token: ${token.text}`}
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Line (row) highlights */}
              {toggles.rows && (
                <Overlay>
                  <>
                    {lineBoxes.filter(l => l.page === pageIndex).map((line, i) => (
                      <BoundingBox
                        key={`line-${pageIndex}-${i}`}
                        className={COLORS.line}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={line.top * scale}
                        left={line.left * scale}
                        width={line.width * scale}
                        height={line.height * scale}
                        onClick={() => setSelectedItem({ type: 'Row', data: line as any })}
                        voiceOverLabel="Row"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Paragraph highlights with auto-opacity via TextHighlightGroup */}
              {toggles.paragraphs && (
                <Overlay>
                  <TextHighlightGroup pageIndex={pageIndex} highlightGroups={paragraphHighlightGroups} />
                </Overlay>
              )}

              {/* Section header highlights */}
              {toggles.sectionHeaders && (
                <Overlay>
                  <>
                    {headerBoxes.filter(h => h.page === pageIndex).map((hdr, i) => (
                      <BoundingBox
                        key={`hdr-${pageIndex}-${i}`}
                        className={COLORS.sectionHeader}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={hdr.top * scale}
                        left={hdr.left * scale}
                        width={hdr.width * scale}
                        height={hdr.height * scale}
                        onClick={() => setSelectedItem({ type: 'Section Header', data: hdr })}
                        voiceOverLabel="Section Header"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Title highlight */}
              {toggles.titles && (
                <Overlay>
                  <>
                    {titleBoxes.filter(ti => ti.page === pageIndex).map((ttl, i) => (
                      <BoundingBox
                        key={`ttl-${pageIndex}-${i}`}
                        className={COLORS.title}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={ttl.top * scale}
                        left={ttl.left * scale}
                        width={ttl.width * scale}
                        height={ttl.height * scale}
                        onClick={() => setSelectedItem({ type: 'Title', data: ttl })}
                        voiceOverLabel="Title"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Author highlights (each author name in a unique color) */}
              {toggles.authors && (
                <Overlay>
                  <>
                    {authorsBoxes.filter(a => a.page === pageIndex).map((auth, i) => (
                      <BoundingBox
                        key={`auth-${pageIndex}-${i}`}
                        className={auth.colorClass || 'bg-blue-200 bg-opacity-50 border border-blue-400'}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={auth.top * scale}
                        left={auth.left * scale}
                        width={auth.width * scale}
                        height={auth.height * scale}
                        onClick={() => setSelectedItem({ type: 'Author', data: auth })}
                        voiceOverLabel={`Author: ${auth.text}`}
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Abstract highlights */}
              {toggles.abstract && (
                <Overlay>
                  <>
                    {abstractBoxes.filter(a => a.page === pageIndex).map((abs, i) => (
                      <BoundingBox
                        key={`abs-${pageIndex}-${i}`}
                        className={COLORS.abstract}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={abs.top * scale}
                        left={abs.left * scale}
                        width={abs.width * scale}
                        height={abs.height * scale}
                        onClick={() => setSelectedItem({ type: 'Abstract', data: abs })}
                        voiceOverLabel="Abstract"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Caption highlights */}
              {toggles.captions && (
                <Overlay>
                  <>
                    {captionBoxes.filter(c => c.page === pageIndex).map((cap, i) => (
                      <BoundingBox
                        key={`cap-${pageIndex}-${i}`}
                        className={COLORS.caption}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={cap.top * scale}
                        left={cap.left * scale}
                        width={cap.width * scale}
                        height={cap.height * scale}
                        onClick={() => setSelectedItem({ type: 'Caption', data: cap })}
                        voiceOverLabel="Caption"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Footnote highlights */}
              {toggles.footnotes && (
                <Overlay>
                  <>
                    {footnoteBoxes.filter(f => f.page === pageIndex).map((ft, i) => (
                      <BoundingBox
                        key={`ft-${pageIndex}-${i}`}
                        className={COLORS.footnote}
                        underlineClassName="hidden"
                        page={pageIndex}
                        top={ft.top * scale}
                        left={ft.left * scale}
                        width={ft.width * scale}
                        height={ft.height * scale}
                        onClick={() => setSelectedItem({ type: 'Footnote', data: ft })}
                        voiceOverLabel="Footnote"
                      />
                    ))}
                  </>
                </Overlay>
              )}

              {/* Skimming example highlights */}
              {toggles.skimming && (
                <Overlay>
                  <>
                    {paragraphBoxes.filter(p => p.page === 1).slice(0, 2).map((para, i) => (
                      <div
                        key={`skim-${pageIndex}-${i}`}
                        style={{
                          position: 'absolute',
                          top: para.top * scale,
                          left: para.left * scale,
                          width: para.width * scale,
                          height: para.height * scale,
                        }}
                        className={COLORS.skimming}
                      >
                        <div className="absolute top-0 left-0 bg-yellow-600 text-white text-[10px] font-bold px-1">
                          Highlight
                        </div>
                      </div>
                    ))}
                  </>
                </Overlay>
              )}
            </>
          </PageWrapper>
        ))}
      </div>
    </>
  );
};

export default PDFViewerDemoWithDocling;
