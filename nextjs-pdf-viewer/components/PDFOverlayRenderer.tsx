import React from 'react';
import { Overlay } from '@davidkric/pdf-components';

// Types
type Box = { page: number; top: number; left: number; width: number; height: number };
type TokenBox = Box & { text: string };
type LinkBox = Box & { refId?: string; figId?: string; isAnchor?: boolean };

type SelectedItem = {
  type: 'token' | 'line' | 'paragraph' | 'header' | 'title' | 'caption' | 'footnote';
  page: number;
  text?: string;
  coords: { top: number; left: number; width: number; height: number };
  id: string;
};

type FeatureToggles = {
  tokens: boolean;
  rows: boolean;
  paragraphs: boolean;
  sectionHeaders: boolean;
  footnotes: boolean;
  captions: boolean;
  titles: boolean;
  skimming: boolean;
  thumbnails: boolean;
};

interface PDFOverlayRendererProps {
  pageIndex: number;
  toggles: FeatureToggles;
  selectedIds: Set<string>;
  onItemSelect: (item: SelectedItem) => void;
  
  // Overlay data
  citationLinks: LinkBox[];
  figureLinks: LinkBox[];
  paragraphBoxes: Box[];
  headerBoxes: Box[];
  titleBoxes: Box[];
  captionBoxes: Box[];
  footnoteBoxes: Box[];
  lineBoxes: Box[];
  preciseTokenBoxes: TokenBox[];
  
  // Scroll functions
  scrollToId: (id: string) => void;
}

/**
 * Renders all PDF overlays for a specific page with proper z-index layering.
 * Overlays are rendered from largest (paragraphs) to smallest (tokens) to ensure
 * proper visibility and interaction hierarchy.
 */
export const PDFOverlayRenderer: React.FC<PDFOverlayRendererProps> = ({
  pageIndex,
  toggles,
  selectedIds,
  onItemSelect,
  citationLinks,
  figureLinks,
  paragraphBoxes,
  headerBoxes,
  titleBoxes,
  captionBoxes,
  footnoteBoxes,
  lineBoxes,
  preciseTokenBoxes,
  scrollToId,
}) => {
  const createOverlayElement = (
    id: string,
    box: Box,
    zIndex: number,
    selectedClass: string,
    normalClass: string,
    item: SelectedItem
  ) => {
    const isSelected = selectedIds.has(id);
    return (
      <div
        key={id}
        id={id}
        style={{
          position: 'absolute',
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          zIndex,
        }}
        className={`cursor-pointer border ${
          isSelected ? selectedClass : normalClass
        } hover:bg-opacity-25`}
        onClick={() => onItemSelect(item)}
      />
    );
  };

  return (
    <>
      {/* Citation and Figure Links */}
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

      {/* Paragraphs - largest structural elements, lowest z-index */}
      {toggles.paragraphs && (
        <Overlay>
          <>
            {paragraphBoxes
              .filter(p => p.page === pageIndex)
              .map((para, i) => {
                const paraId = `para-${pageIndex}-${i}`;
                return createOverlayElement(
                  paraId,
                  para,
                  1,
                  'bg-yellow-300 border-2 border-yellow-600 bg-opacity-35',
                  'bg-yellow-200 border-yellow-500 bg-opacity-15',
                  {
                    type: 'paragraph',
                    page: pageIndex,
                    text: `Paragraph ${i + 1}`,
                    coords: { top: para.top, left: para.left, width: para.width, height: para.height },
                    id: paraId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {/* Headers, Titles, Captions, Footnotes - medium structural elements */}
      {toggles.sectionHeaders && (
        <Overlay>
          <>
            {headerBoxes
              .filter(h => h.page === pageIndex)
              .map((hdr, i) => {
                const hdrId = `hdr-${pageIndex}-${i}`;
                return createOverlayElement(
                  hdrId,
                  hdr,
                  2,
                  'bg-red-300 border-2 border-red-600 bg-opacity-40',
                  'bg-red-200 border-red-500 bg-opacity-25',
                  {
                    type: 'header',
                    page: pageIndex,
                    text: `Header ${i + 1}`,
                    coords: { top: hdr.top, left: hdr.left, width: hdr.width, height: hdr.height },
                    id: hdrId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {toggles.titles && (
        <Overlay>
          <>
            {titleBoxes
              .filter(ti => ti.page === pageIndex)
              .map((ttl, i) => {
                const ttlId = `ttl-${pageIndex}-${i}`;
                return createOverlayElement(
                  ttlId,
                  ttl,
                  2,
                  'bg-blue-300 border-2 border-blue-600 bg-opacity-35',
                  'bg-blue-200 border-blue-500 bg-opacity-20',
                  {
                    type: 'title',
                    page: pageIndex,
                    text: `Title ${i + 1}`,
                    coords: { top: ttl.top, left: ttl.left, width: ttl.width, height: ttl.height },
                    id: ttlId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {toggles.captions && (
        <Overlay>
          <>
            {captionBoxes
              .filter(c => c.page === pageIndex)
              .map((cap, i) => {
                const capId = `cap-${pageIndex}-${i}`;
                return createOverlayElement(
                  capId,
                  cap,
                  2,
                  'bg-pink-300 border-2 border-pink-600 bg-opacity-35',
                  'bg-pink-200 border-pink-500 bg-opacity-20',
                  {
                    type: 'caption',
                    page: pageIndex,
                    text: `Caption ${i + 1}`,
                    coords: { top: cap.top, left: cap.left, width: cap.width, height: cap.height },
                    id: capId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {toggles.footnotes && (
        <Overlay>
          <>
            {footnoteBoxes
              .filter(f => f.page === pageIndex)
              .map((ft, i) => {
                const ftId = `ft-${pageIndex}-${i}`;
                return createOverlayElement(
                  ftId,
                  ft,
                  2,
                  'bg-purple-400 border-2 border-purple-700 bg-opacity-35',
                  'bg-purple-300 border-purple-600 bg-opacity-20',
                  {
                    type: 'footnote',
                    page: pageIndex,
                    text: `Footnote ${i + 1}`,
                    coords: { top: ft.top, left: ft.left, width: ft.width, height: ft.height },
                    id: ftId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {/* Lines - medium-size elements */}
      {toggles.rows && (
        <Overlay>
          <>
            {lineBoxes
              .filter(l => l.page === pageIndex)
              .map((line, i) => {
                const lineId = `line-${pageIndex}-${i}`;
                return createOverlayElement(
                  lineId,
                  line,
                  3,
                  'bg-orange-300 border-2 border-orange-600 bg-opacity-40',
                  'bg-orange-200 border-orange-500 bg-opacity-20',
                  {
                    type: 'line',
                    page: pageIndex,
                    text: `Line ${i + 1}`,
                    coords: { top: line.top, left: line.left, width: line.width, height: line.height },
                    id: lineId,
                  }
                );
              })}
          </>
        </Overlay>
      )}

      {/* Tokens - smallest elements, highest z-index for maximum visibility */}
      {toggles.tokens && (
        <Overlay>
          <>
            {preciseTokenBoxes
              .filter(t => t.page === pageIndex)
              .map((token, i) => {
                const tokenId = `token-${pageIndex}-${i}`;
                const isSelected = selectedIds.has(tokenId);
                return (
                  <div
                    key={tokenId}
                    id={tokenId}
                    style={{
                      position: 'absolute',
                      top: token.top,
                      left: token.left,
                      width: token.width,
                      height: token.height,
                      zIndex: 4, // Highest z-index to ensure visibility
                      pointerEvents: 'auto',
                    }}
                  >
                    <div
                      className={`w-full h-full cursor-pointer ${
                        isSelected 
                          ? 'border-2 border-green-600 bg-green-300 bg-opacity-50 shadow-sm' 
                          : 'border border-green-500 bg-green-200 bg-opacity-15'
                      } hover:bg-opacity-30`}
                      onClick={() => {
                        const newItem: SelectedItem = {
                          type: 'token',
                          page: pageIndex,
                          text: token.text,
                          coords: { top: token.top, left: token.left, width: token.width, height: token.height },
                          id: tokenId,
                        };
                        onItemSelect(newItem);
                      }}
                    />
                  </div>
                );
              })}
          </>
        </Overlay>
      )}

      {/* Skimming highlights - special emphasis layer */}
      {toggles.skimming && (
        <Overlay>
          <>
            {paragraphBoxes
              .filter(p => p.page === 1) // Example highlights on page 2
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
                    zIndex: 5, // Above all other overlays
                  }}
                  className="bg-yellow-200 bg-opacity-50 border-2 border-yellow-600"
                >
                  <div className="absolute top-0 left-0 bg-yellow-600 text-white text-xs font-bold px-1">
                    Highlight
                  </div>
                </div>
              ))}
          </>
        </Overlay>
      )}
    </>
  );
}; 