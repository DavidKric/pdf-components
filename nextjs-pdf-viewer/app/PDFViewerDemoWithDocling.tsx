'use client';

import React, { useContext, useState, useMemo } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  UiContext,
  RENDER_TYPE,
  Overlay,
  scrollToId,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';

import type {
  DoclingDocument,
  TextItem,
  GroupItem,
  RefItem,
  PictureItem,
  BoundingBox,
  TitleItem,
  SectionHeaderItem,
  ListItem,
  CodeItem,
  FormulaItem,
} from '@docling/docling-core';

// -------- data --------------------------------------------------------------
import rawJson from './2408.09869v3.json';
const docData = rawJson as DoclingDocument;           // ✅ typed document
const PDF_URL = 'https://arxiv.org/pdf/2408.09869v3';

// ---------------------------------------------------------------------------
// Utility types for our internal overlay arrays
type Box = { page: number; top: number; left: number; width: number; height: number };
type TokenBox = Box & { text: string };
type LinkBox = Box & { refId?: string; figId?: string; isAnchor?: boolean };

// ---------------------------------------------------------------------------
// Component
const PDFViewerDemo: React.FC = () => {
  // feature toggles
  const [toggles, setToggles] = useState({
    tokens: false,
    rows: false,
    paragraphs: false,
    sectionHeaders: false,
    footnotes: false,
    captions: false,
    titles: false,
    skimming: false,
  });
  const [openToken, setOpenToken] = useState<string | null>(null);

  const toggleFeature = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    if (key === 'tokens') setOpenToken(null);
  };

  return (
    <ContextProvider>
      <div className="fixed top-12 left-0 right-0 h-12 bg-gray-800 text-gray-100 flex items-center px-4 z-40 shadow">
        <span className="font-bold text-sm text-yellow-400 mr-4">
          Semantic Reader + PaperMage Demo
        </span>
        {(
          [
            ['tokens', 'Tokens'],
            ['rows', 'Rows'],
            ['paragraphs', 'Paragraphs'],
            ['sectionHeaders', 'Section Headers'],
            ['titles', 'Titles'],
            ['captions', 'Captions'],
            ['footnotes', 'Footnotes'],
            ['skimming', 'Skimming Highlights'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`${
              toggles[key]
                ? 'bg-gray-700 text-yellow-300'
                : 'bg-gray-800 hover:bg-gray-700'
            } px-2 py-1 mr-1 rounded text-xs`}
            onClick={() => toggleFeature(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pdf-viewer-container relative" style={{ marginTop: '96px' }}>
        <DocumentWrapper file={PDF_URL} renderType={RENDER_TYPE.SINGLE_CANVAS}>
          <PDFContent toggles={toggles} openToken={openToken} setOpenToken={setOpenToken} />
        </DocumentWrapper>
      </div>
    </ContextProvider>
  );
};

// Inner component that can access DocumentContext and UiContext
const PDFContent: React.FC<{
  toggles: any;
  openToken: string | null;
  setOpenToken: (token: string | null) => void;
}> = ({ toggles, openToken, setOpenToken }) => {
  // coordinate constants
  const pageHeight = 792; // 11 in × 72 pt/in

  // Now we can access the contexts inside DocumentWrapper
  const { numPages } = useContext(DocumentContext);
  const { errorMessage, isLoading } = useContext(UiContext);

  // -------------------------------------------------------------------------
  // derive overlay data once
  const {
    tokenBoxes,
    lineBoxes,
    paragraphBoxes,
    headerBoxes,
    footnoteBoxes,
    captionBoxes,
    titleBoxes,
    citationLinks,
    figureLinks,
  } = useMemo(() => {
    const texts = docData.texts ?? [];
    const tokenList: TokenBox[] = [];
    const lineList: Box[] = [];
    const paragraphList: Box[] = [];
    const headerList: Box[] = [];
    const footnoteList: Box[] = [];
    const captionList: Box[] = [];
    const titleList: Box[] = [];
    const citationLinkList: LinkBox[] = [];
    const figureLinkList: LinkBox[] = [];

    // helper for token width
    const computeSegmentPosition = (
      lineText: string,
      segStart: number,
      segEnd: number,
      lineBoundingBox: BoundingBox,
    ) => {
      const textNoSpace = lineText.replace(/ /g, '');
      const totalLen = textNoSpace.length || 1; // avoid /0
      const prefixLen = lineText.slice(0, segStart).replace(/ /g, '').length;
      const segmentLen = lineText.slice(segStart, segEnd).replace(/ /g, '').length;
      const { l: lineLeft, r: lineRight } = lineBoundingBox;
      const ratioStart = prefixLen / totalLen;
      const ratioEnd = (prefixLen + segmentLen) / totalLen;
      const left = lineLeft + ratioStart * (lineRight - lineLeft);
      const width = (ratioEnd - ratioStart) * (lineRight - lineLeft);
      return { left, width };
    };

    // -----------------------------------------------------------------------
    // iterate text items
    texts.forEach((item) => {
      const { label, prov, text } = item;
      if (!prov?.length || !prov[0].bbox) return;
      const firstProv = prov[0];
      const BoundingBox = firstProv.bbox;
      const pageIdx = firstProv.page_no - 1;
      const { t: topY, b: bottomY, l: leftX, r: rightX } = BoundingBox;
      const elemHeight = topY - bottomY;
      const elemWidth = rightX - leftX;

      if (label === 'text' && text && text.length > 100) {
        paragraphList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
        });
      }
      if (label === 'section_header') {
        headerList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
        });
      }
      if (label === 'footnote') {
        footnoteList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
        });
      }
      if (label === 'caption') {
        captionList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
        });
      }
      if (label === 'title') {
        titleList.push({
          page: pageIdx,
          top: pageHeight - topY,
          left: leftX,
          width: elemWidth,
          height: elemHeight,
        });
      }

      if (!text) return;

      // line + token processing
      const lines = text.split('\n');
      const lineHeight = lines.length > 1 ? elemHeight / lines.length : elemHeight;

      lines.forEach((lineText: string, lineIndex: number) => {
        const lineTopY = topY - lineIndex * lineHeight;
        const lineBoundingBox: BoundingBox = { l: leftX, r: rightX, t: lineTopY, b: lineTopY - lineHeight };
        lineList.push({
          page: pageIdx,
          top: pageHeight - lineTopY,
          left: leftX,
          width: rightX - leftX,
          height: lineHeight,
        });

        const tokens = lineText.split(/\s+/).filter(tok => tok.length > 0);
        let charCountSoFar = 0;
        tokens.forEach((tokenText: string) => {
          const tokenLen = tokenText.replace(/ /g, '').length;
          const startChar = charCountSoFar;
          const endChar = charCountSoFar + tokenLen;
          charCountSoFar += tokenLen;

          const { left, width } = computeSegmentPosition(lineText, startChar, endChar, lineBoundingBox);
          tokenList.push({
            page: pageIdx,
            top: pageHeight - lineTopY,
            left,
            width,
            height: lineHeight,
            text: tokenText,
          });
        });

        // citation links
        const citationPattern = /\[(\d+(?:[\-,]\s*\d+)*)\]/g;
        let citeMatch: RegExpExecArray | null;
        while ((citeMatch = citationPattern.exec(lineText)) !== null) {
          const matchIndex = citeMatch.index;
          const matchEnd = matchIndex + citeMatch[0].length;
          const { left: citeLeft, width: citeWidth } = computeSegmentPosition(
            lineText,
            matchIndex,
            matchEnd,
            lineBoundingBox,
          );
          const targetNum = citeMatch[1].split(/[\-,]/)[0].trim();
          citationLinkList.push({
            page: pageIdx,
            top: pageHeight - lineTopY,
            left: citeLeft,
            width: citeWidth,
            height: lineHeight,
            refId: `ref-${targetNum}`,
          });
        }

        // figure links
        const figPattern = /Figure\s+(\d+)(?!:)/g;
        let figMatch: RegExpExecArray | null;
        while ((figMatch = figPattern.exec(lineText)) !== null) {
          const figNum = figMatch[1];
          const matchIndex = figMatch.index;
          const matchEnd = matchIndex + `Figure ${figNum}`.length;
          const { left: figLeft, width: figWidth } = computeSegmentPosition(
            lineText,
            matchIndex,
            matchEnd,
            lineBoundingBox,
          );
          figureLinkList.push({
            page: pageIdx,
            top: pageHeight - lineTopY,
            left: figLeft,
            width: figWidth,
            height: lineHeight,
            figId: `fig-${figNum}`,
          });
        }
      });
    });

    // reference anchors
    docData.groups?.forEach((group: GroupItem) => {
      if (
        (group.label === 'list' || group.label === 'ordered_list') &&
        group.parent?.$ref === '#/body'
      ) {
        group.children?.forEach((refChild: RefItem) => {
          const refItem = docData.texts?.find((t) => t.self_ref === refChild.$ref);
          if (refItem?.orig?.startsWith('[') && refItem.prov?.[0]?.bbox) {
            const match = refItem.orig.match(/^\[(\d+)\]/);
            if (match) {
              const refNum = match[1];
              const BoundingBox = refItem.prov[0].bbox;
              const pageIdx = refItem.prov[0].page_no - 1;
              citationLinkList.push({
                page: pageIdx,
                top: pageHeight - BoundingBox.t,
                left: BoundingBox.l,
                width: 1,
                height: 1,
                refId: `ref-${refNum}`,
                isAnchor: true,
              });
            }
          }
        });
      }
    });

    // figure anchors
    docData.pictures?.forEach((picture: PictureItem) => {
      if (!picture.prov?.[0]?.bbox) return;
      const BoundingBox = picture.prov[0].bbox;
      const pageIdx = picture.prov[0].page_no - 1;
      if (picture.captions?.length) {
        const capText =
          docData.texts?.find((t) => t.self_ref === picture.captions![0].$ref)?.orig ?? '';
        const match = capText.match(/^Figure\s+(\d+)/);
        if (match) {
          const figNum = match[1];
          figureLinkList.push({
            page: pageIdx,
            top: pageHeight - BoundingBox.t,
            left: BoundingBox.l,
            width: 1,
            height: 1,
            figId: `fig-${figNum}`,
            isAnchor: true,
          });
        }
      }
    });

    return {
      tokenBoxes: tokenList,
      lineBoxes: lineList,
      paragraphBoxes: paragraphList,
      headerBoxes: headerList,
      footnoteBoxes: footnoteList,
      captionBoxes: captionList,
      titleBoxes: titleList,
      citationLinks: citationLinkList,
      figureLinks: figureLinkList,
    };
  }, []);

  // Add error handling to see what's preventing PDF loading
  React.useEffect(() => {
    console.log('PDFViewerDemoWithDocling - numPages:', numPages);
    console.log('PDFViewerDemoWithDocling - PDF_URL:', PDF_URL);
    console.log('PDFViewerDemoWithDocling - isLoading:', isLoading);
    console.log('PDFViewerDemoWithDocling - errorMessage:', errorMessage);
    
    if (numPages === 0) {
      console.log('PDF not loaded yet. Checking worker and Document setup...');
    } else {
      console.log('PDF loaded successfully with', numPages, 'pages');
    }
  }, [numPages, isLoading, errorMessage]);

  return (
    <>
      {/* Error message display */}
      {errorMessage && (
        <div className="fixed top-12 left-0 right-0 bg-red-600 text-white p-4 z-50">
          <strong>PDF Loading Error:</strong> {errorMessage}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-12 left-0 right-0 bg-blue-600 text-white p-4 z-50">
          Loading PDF...
        </div>
      )}

      <div className="pdf-reader__page-list">
        {Array.from({ length: numPages ?? 0 }).map((_, pageIndex) => (
          <PageWrapper
            key={pageIndex}
            pageIndex={pageIndex}
            renderType={RENDER_TYPE.SINGLE_CANVAS}
          >
            <>
              {/* citation links */}
              <Overlay>
                <>
                  {citationLinks
                    .filter(c => c.page === pageIndex && !c.isAnchor)
                    .map((c, i) => (
                      <div
                        key={`cite-${pageIndex}-${i}`}
                        onClick={() => scrollToId(c.refId!)}
                        style={{
                          position: 'absolute',
                          top: c.top,
                          left: c.left,
                          width: c.width,
                          height: c.height,
                        }}
                        className="bg-blue-100 bg-opacity-50 border border-blue-500 cursor-pointer"
                        title={`Go to reference ${c.refId!.replace('ref-', '')}`}
                      />
                    ))}
                  {citationLinks
                    .filter(c => c.page === pageIndex && c.isAnchor)
                    .map((c, i) => (
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

              {/* figure links */}
              <Overlay>
                <>
                  {figureLinks
                    .filter(f => f.page === pageIndex && !f.isAnchor)
                    .map((f, i) => (
                      <div
                        key={`figlink-${pageIndex}-${i}`}
                        onClick={() => scrollToId(f.figId!)}
                        style={{
                          position: 'absolute',
                          top: f.top,
                          left: f.left,
                          width: f.width,
                          height: f.height,
                        }}
                        className="bg-purple-100 bg-opacity-50 border border-purple-500 cursor-pointer"
                        title={`View Figure ${f.figId!.replace('fig-', '')}`}
                      />
                    ))}
                  {figureLinks
                    .filter(f => f.page === pageIndex && f.isAnchor)
                    .map((f, i) => (
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

              {/* tokens */}
              {toggles.tokens && (
                <Overlay>
                  <>
                    {tokenBoxes
                      .filter(t => t.page === pageIndex)
                      .map((token, i) => {
                        const tokenId = `token-${pageIndex}-${i}`;
                        const isOpen = openToken === tokenId;
                        return (
                          <div
                            key={tokenId}
                            style={{
                              position: 'absolute',
                              top: token.top,
                              left: token.left,
                              width: token.width,
                              height: token.height,
                              pointerEvents: 'auto',
                            }}
                          >
                            <div
                              className="w-full h-full border border-green-500 bg-green-200 bg-opacity-10 cursor-pointer"
                              onClick={() =>
                                setOpenToken(isOpen ? null : tokenId)
                              }
                            />
                            {isOpen && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: token.height + 4,
                                  left: 0,
                                  zIndex: 30,
                                }}
                                className="bg-white border border-green-600 rounded px-2 py-1 text-xs shadow"
                              >
                                <div>
                                  <strong>Token:</strong> {token.text}
                                </div>
                                <div className="mt-1 text-gray-700">
                                  Page {token.page + 1}, x=
                                  {token.left.toFixed(1)}, y=
                                  {token.top.toFixed(1)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </>
                </Overlay>
              )}

              {/* lines */}
              {toggles.rows && (
                <Overlay>
                  <>
                    {lineBoxes
                      .filter(l => l.page === pageIndex)
                      .map((line, i) => (
                        <div
                          key={`line-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: line.top,
                            left: line.left,
                            width: line.width,
                            height: line.height,
                          }}
                          className="bg-orange-200 bg-opacity-20 border border-orange-400"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* paragraphs */}
              {toggles.paragraphs && (
                <Overlay>
                  <>
                    {paragraphBoxes
                      .filter(p => p.page === pageIndex)
                      .map((para, i) => (
                        <div
                          key={`para-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: para.top,
                            left: para.left,
                            width: para.width,
                            height: para.height,
                          }}
                          className="bg-yellow-300 bg-opacity-15 border border-yellow-500"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* headers */}
              {toggles.sectionHeaders && (
                <Overlay>
                  <>
                    {headerBoxes
                      .filter(h => h.page === pageIndex)
                      .map((hdr, i) => (
                        <div
                          key={`hdr-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: hdr.top,
                            left: hdr.left,
                            width: hdr.width,
                            height: hdr.height,
                          }}
                          className="bg-red-200 bg-opacity-25 border border-red-500"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* title */}
              {toggles.titles && (
                <Overlay>
                  <>
                    {titleBoxes
                      .filter(ti => ti.page === pageIndex)
                      .map((ttl, i) => (
                        <div
                          key={`ttl-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: ttl.top,
                            left: ttl.left,
                            width: ttl.width,
                            height: ttl.height,
                          }}
                          className="bg-teal-200 bg-opacity-20 border border-teal-600"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* captions */}
              {toggles.captions && (
                <Overlay>
                  <>
                    {captionBoxes
                      .filter(c => c.page === pageIndex)
                      .map((cap, i) => (
                        <div
                          key={`cap-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: cap.top,
                            left: cap.left,
                            width: cap.width,
                            height: cap.height,
                          }}
                          className="bg-pink-200 bg-opacity-20 border border-pink-500"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* footnotes */}
              {toggles.footnotes && (
                <Overlay>
                  <>
                    {footnoteBoxes
                      .filter(f => f.page === pageIndex)
                      .map((ft, i) => (
                        <div
                          key={`ft-${pageIndex}-${i}`}
                          style={{
                            position: 'absolute',
                            top: ft.top,
                            left: ft.left,
                            width: ft.width,
                            height: ft.height,
                          }}
                          className="bg-purple-300 bg-opacity-20 border border-purple-600"
                        />
                      ))}
                  </>
                </Overlay>
              )}

              {/* skimming */}
              {toggles.skimming && (
                <Overlay>
                  <>
                    {paragraphBoxes
                      .filter(p => p.page === 1) // example highlights on page 2 (index 1)
                      .slice(0, 2)
                      .map((para, i) => (
                        <div
                          key={`skim-${i}`}
                          style={{
                            position: 'absolute',
                            top: para.top,
                            left: para.left,
                            width: para.width,
                            height: para.height,
                          }}
                          className="bg-yellow-200 bg-opacity-50 border-2 border-yellow-600"
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

export default PDFViewerDemo;
