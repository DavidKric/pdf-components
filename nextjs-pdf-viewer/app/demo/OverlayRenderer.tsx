import React, { useContext, useState } from 'react';
import { DocumentContext, Overlay as PdfOverlay, scrollToId, HighlightOverlay, BoundingBox } from '@davidkric/pdf-components';
import type { BoundingBoxProps } from '@davidkric/pdf-components';
import { TransformContext } from '@davidkric/pdf-components';
import { relativeToAbsoluteBox, RelativeBBox } from './bboxUtils';
import SelectionOverlay from './SelectionOverlay';
import CitationPopover from './CitationPopover';
import FigurePopover from './FigurePopover'; // Added
import './token-highlight.css';

// Cast Overlay so it will accept any React nodes instead of only <BoundingBox>
const Overlay = PdfOverlay as unknown as React.FC<{ children?: React.ReactNode }>;

type Token = { left: number; top: number; width: number; height: number; page: number; text: string; id?: string | number };

type Props = {
  toggles: { [key: string]: boolean };
  tokenHighlights: Array<RelativeBBox & { text: string }>;
  lineHighlights: Array<RelativeBBox & { text: string }>;
  paragraphHighlights: Array<RelativeBBox & { text: string }>;
  headerHighlights: Array<RelativeBBox & { text: string }>;
  titleHighlights: Array<RelativeBBox & { text: string }>;
  captionHighlights: Array<RelativeBBox & { text: string }>;
  footnoteHighlights: Array<RelativeBBox & { text: string }>;
  citationLinks: Array<RelativeBBox & { refId: string; text: string; isAnchor?: boolean }>;
  figureLinks: Array<RelativeBBox & { figId: string; text: string; isAnchor?: boolean }>;
  imageHighlights: Array<RelativeBBox>;
  tableHighlights?: Array<RelativeBBox & { text: string }>;    // New
  formulaHighlights?: Array<RelativeBBox & { text: string }>;  // New
  codeHighlights?: Array<RelativeBBox & { text: string }>;     // New
  furnitureHighlights?: Array<RelativeBBox & { text: string } desiringFocusRing>; // New
  selectionMode: boolean;
  onEntitySelect: (entity: { type: string; label: string; content?: string; page?: number; coords?: any } | null) => void;
  onRegionSelect: (entity: { type: string; label: string; content?: string; page?: number; coords?: any } | null) => void;
  onlyPage?: number;
  isFocusMode?: boolean;
  selectedEntity?: { type: string; label: string; content?: string; page?: number; coords?: any } | null;
  bibliography?: { [refId: string]: string };
  figureCaptions?: { [figId: string]: string }; // Added
};

const OverlayRenderer: React.FC<Props> = (props) => {
  const documentContext = React.useContext(DocumentContext as any) as any;
  const transformContext = React.useContext(TransformContext as any) as any;
  const numPages = documentContext.numPages;
  const pageDimensions = documentContext.pageDimensions;
  const scale = transformContext.scale;
  const rotation = transformContext.rotation;
  
  if (!pageDimensions) {
    return null;
  }

  // Use the same coordinate system as React-PDF and core library components
  // React-PDF handles devicePixelRatio internally, so we only use base scale
  const renderedWidth = pageDimensions.width * scale;
  const renderedHeight = pageDimensions.height * scale;
  
  // State for selected tokens
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<string>>(new Set());
  // State for active citation popover
  const [activePopoverInfo, setActivePopoverInfo] = useState<{
    refId: string;
    content: string;
    position: { top: number; left: number; page: number };
  } | null>(null);
  // State for active figure popover
  const [activeFigurePopoverInfo, setActiveFigurePopoverInfo] = useState<{
    figId: string;
    caption: string;
    position: { top: number; left: number; page: number };
  } | null>(null);

  const toAbs = (box: RelativeBBox) => relativeToAbsoluteBox(box, renderedWidth, renderedHeight);

  const styleFromRel = (b: RelativeBBox) => {
    const { left, top, width, height } = toAbs(b);
    return { left, top, width, height } as React.CSSProperties;
  };

  const {
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
    imageHighlights,
    selectionMode,
    onEntitySelect,
    onRegionSelect,
    onlyPage,
    isFocusMode,
    selectedEntity,
    bibliography,
    figureCaptions, // Added
    tableHighlights = [],    // New with default
    formulaHighlights = [],  // New with default
    codeHighlights = [],     // New with default
    furnitureHighlights = [], // New with default
  } = props;

  if (!numPages || numPages <= 0) return null;  // if PDF not yet loaded

  /** Helper: common handler for text-based highlight click */
  const selectTextEntity = (
    type: string, label: string, content: string, page: number, coords: { top: number; left: number; width: number; height: number }
  ) => {
    onEntitySelect({ type, label, content, page: page + 1, coords });  // use 1-indexed page in label for user-friendliness
  };

  // If onlyPage supplied, we limit to that single page; else render all pages
  const pageIndices = onlyPage !== undefined ? [onlyPage] : Array.from({ length: numPages }).map((_, i) => i);

  return (
    <>
      {/* Render each page and its overlay layers */}
      {pageIndices.map((pageIndex) => (
        <Overlay key={pageIndex}>
          {isFocusMode && selectedEntity && selectedEntity.coords && selectedEntity.page === pageIndex + 1 ? (
            <HighlightOverlay>
              <BoundingBox
                pageIndex={pageIndex}
                top={selectedEntity.coords.top}
                left={selectedEntity.coords.left}
                width={selectedEntity.coords.width}
                height={selectedEntity.coords.height}
                style={{ background: 'rgba(255, 255, 0, 0.3)', border: '1px solid yellow' }} // Example styling
              />
            </HighlightOverlay>
          ) : (
            <>
              {/* Citation reference overlays (click to scroll to bibliography) */}
              {citationLinks.filter(c => c.page === pageIndex && !c.isAnchor).map((c, i) => {
                const absCoords = styleFromRel(c); // Get absolute pixel coords for positioning
                return (
                  <div
                    key={`cite-${pageIndex}-${i}`}
                    onClick={() => {
                      if (bibliography) {
                        const fullText = bibliography[c.refId];
                        if (fullText) {
                          // Adjust position slightly for better popover placement (e.g., below the link)
                          const popoverTop = (absCoords.top as number) + (absCoords.height as number) + 5; // 5px offset
                          const popoverLeft = absCoords.left as number;
                          setActiveFigurePopoverInfo(null); // Close other popover type
                          setActivePopoverInfo({
                            refId: c.refId,
                            content: fullText,
                            position: { top: popoverTop, left: popoverLeft, page: pageIndex, triggerHeight: absCoords.height as number },
                          });
                        } else {
                          setActivePopoverInfo(null); // Or some error/fallback
                        }
                      }
                      scrollToId(c.refId); // Keep scroll functionality
                    }}
                    title={`View details for reference ${c.refId.replace('ref-', '')}. Click to scroll to bibliography.`}
                    style={{ position: 'absolute', ...absCoords }}
                    className="bg-blue-100 bg-opacity-25 cursor-pointer mix-blend-multiply hover:bg-opacity-40 hover:border hover:border-blue-500"
                  />
                );
              })}
              {/* Citation anchors (targets for scrolling, not clickable) */}
              {citationLinks.filter(c => c.page === pageIndex && c.isAnchor).map((c, i) => (
                <div
                  key={`citeAnchor-${pageIndex}-${i}`}
                  id={c.refId}
                  style={{ position: 'absolute', ...styleFromRel(c) }}
                />
              ))}

              {/* Figure reference overlays (click to scroll to figure) */}
              {figureLinks.filter(f => f.page === pageIndex && !f.isAnchor).map((f, i) => {
                const absCoords = styleFromRel(f);
                return (
                  <div
                    key={`fig-${pageIndex}-${i}`}
                    onClick={() => {
                      if (figureCaptions) {
                        const captionText = figureCaptions[f.figId];
                        if (captionText) {
                          const popoverTop = (absCoords.top as number) + (absCoords.height as number) + 5; // 5px offset
                          const popoverLeft = absCoords.left as number;
                          setActivePopoverInfo(null); // Close other popover type
                          setActiveFigurePopoverInfo({
                            figId: f.figId,
                            caption: captionText,
                            position: { top: popoverTop, left: popoverLeft, page: pageIndex, triggerHeight: absCoords.height as number },
                          });
                        } else {
                          setActiveFigurePopoverInfo(null);
                        }
                      }
                      scrollToId(f.figId);
                    }}
                    title={`View caption for ${f.text}. Click to scroll to figure.`}
                    style={{ position: 'absolute', ...absCoords }}
                    className="bg-purple-100 bg-opacity-30 cursor-pointer mix-blend-multiply hover:bg-opacity-40 hover:border hover:border-purple-500"
                  />
                );
              })}
              {/* Figure anchors (target positions for scrolling) – rendered only when Images overlay is enabled */}
              {toggles.images && figureLinks.filter(f => f.page === pageIndex && f.isAnchor).map((f, i) => (
                <div
                  key={`figAnchor-${pageIndex}-${i}`}
                  id={f.figId}
                  style={{ position: 'absolute', ...styleFromRel(f) }}
                  className="bg-purple-100 bg-opacity-15 border border-purple-500 mix-blend-multiply"
                />
              ))}

              {/* Image / figure bounding boxes (blue outline) */}
              {toggles.images && imageHighlights.filter(img => img.page === pageIndex).map((img, i) => (
                <div
                  key={`img-${pageIndex}-${i}`}
                  style={{ position: 'absolute', ...styleFromRel(img) }}
                  className="bg-indigo-200 bg-opacity-10 border border-indigo-400 mix-blend-multiply"
                />
              ))}

              {/* Line highlights (orange translucent bars covering entire line) */}
              {toggles.lines && lineHighlights.filter(l => l.page === pageIndex).map((line, i) => (
                <div
                  key={`line-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('line', 'Line', line.text, pageIndex, line)}
                  style={{ position: 'absolute', ...styleFromRel(line) }}
                  className="bg-orange-300 bg-opacity-20 hover:bg-opacity-30 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Paragraph highlights (light yellow area covering paragraph block) */}
              {toggles.paragraphs && paragraphHighlights.filter(p => p.page === pageIndex).map((para, i) => (
                <div
                  key={`para-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('paragraph', 'Paragraph', para.text, pageIndex, para)}
                  style={{ position: 'absolute', ...styleFromRel(para) }}
                  className="bg-yellow-300 bg-opacity-10 hover:bg-opacity-20 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Section header highlights (red) */}
              {toggles.sectionHeaders && headerHighlights.filter(h => h.page === pageIndex).map((hdr, i) => (
                <div
                  key={`hdr-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('sectionHeader', 'Section Header', hdr.text, pageIndex, hdr)}
                  style={{ position: 'absolute', ...styleFromRel(hdr) }}
                  className="bg-red-200 bg-opacity-25 hover:bg-opacity-35 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Title highlights (teal) */}
              {toggles.titles && titleHighlights.filter(ti => ti.page === pageIndex).map((ttl, i) => (
                <div
                  key={`title-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('title', 'Title', ttl.text, pageIndex, ttl)}
                  style={{ position: 'absolute', ...styleFromRel(ttl) }}
                  className="bg-teal-200 bg-opacity-20 hover:bg-opacity-30 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Caption highlights (pink) */}
              {toggles.captions && captionHighlights.filter(c => c.page === pageIndex).map((cap, i) => (
                <div
                  key={`cap-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('caption', 'Caption', cap.text, pageIndex, cap)}
                  style={{ position: 'absolute', ...styleFromRel(cap) }}
                  className="bg-pink-200 bg-opacity-20 hover:bg-opacity-30 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Footnote highlights (purple) */}
              {toggles.footnotes && footnoteHighlights.filter(f => f.page === pageIndex).map((ft, i) => (
                <div
                  key={`foot-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('footnote', 'Footnote', ft.text, pageIndex, ft)}
                  style={{ position: 'absolute', ...styleFromRel(ft) }}
                  className="bg-purple-300 bg-opacity-20 hover:bg-opacity-30 cursor-pointer mix-blend-multiply"
                />
              ))}

              {/* Token highlights (FIXED: using same coordinate system as other overlays) */}
              {toggles.tokens && tokenHighlights.filter(t => t.page === pageIndex).map((token, i) => {
                const tokenId = `tok-${pageIndex}-${i}`;
                const isSelected = selectedTokenIds.has(tokenId);
                return (
                  <div
                    key={tokenId}
                    className={`token-highlight clickable${isSelected ? ' selected' : ''}`}
                    style={{
                      position: 'absolute',
                      ...styleFromRel(token),
                    }}
                    onClick={() => {
                      selectTextEntity('token', 'Token', token.text, pageIndex, token);
                      // Toggle selection state
                      setSelectedTokenIds(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(tokenId)) {
                          newSet.delete(tokenId);
                        } else {
                          newSet.add(tokenId);
                        }
                        return newSet;
                      });
                    }}
                  />
                );
              })}

              {/* Drag-to-select overlay (active when selectionMode is true) */}
              <SelectionOverlay
                pageIndex={pageIndex}
                active={selectionMode}
                tokens={tokenHighlights.filter(t => t.page === pageIndex).map((token, i) => ({
                  ...token,
                  id: `tok-${pageIndex}-${i}`
                }))}
                onSelect={(selectedTokens) => {
                  if (selectedTokens && selectedTokens.length > 0) {
                    // Sort tokens by vertical position, then horizontal
                    selectedTokens.sort((a, b) => a.top === b.top ? a.left - b.left : a.top - b.top);
                    // Join token texts, inserting line breaks when moving to a new line
                    let assembledText = selectedTokens[0].text;
                    for (let t = 1; t < selectedTokens.length; t++) {
                      const prev = selectedTokens[t-1];
                      const curr = selectedTokens[t];
                      if (Math.abs(curr.top - prev.top) > prev.height * 0.5) {
                        // Next token is on a new line (significant vertical gap)
                        assembledText += '\n';
                      } else {
                        assembledText += ' ';
                      }
                      assembledText += curr.text;
                    }

                    // Update selected token IDs
                    const tokenIds = selectedTokens.map(token => token.id?.toString() || '').filter(Boolean);
                    setSelectedTokenIds(new Set(tokenIds));

                    onRegionSelect({
                      type: 'region',
                      label: 'Selected Tokens',
                      content: assembledText,
                      page: pageIndex + 1,
                      coords: {
                        top: Math.min(...selectedTokens.map(t => t.top)),
                        left: Math.min(...selectedTokens.map(t => t.left)),
                        width: Math.max(...selectedTokens.map(t => t.left + t.width)) - Math.min(...selectedTokens.map(t => t.left)),
                        height: Math.max(...selectedTokens.map(t => t.top + t.height)) - Math.min(...selectedTokens.map(t => t.top)),
                      },
                    });
                  } else {
                    // Drag canceled or no selection
                    setSelectedTokenIds(new Set());
                    onRegionSelect(null);
                  }
                }}
              />

              {/* Table highlights (Light Green) */}
              {toggles.tables && tableHighlights.filter(tbl => tbl.page === pageIndex).map((tbl, i) => (
                <div
                  key={`table-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('table', 'Table', tbl.text, pageIndex, tbl)}
                  style={{ position: 'absolute', ...styleFromRel(tbl), backgroundColor: 'rgba(144, 238, 144, 0.3)', border: '1px solid lightgreen' }}
                  className="cursor-pointer mix-blend-multiply hover:bg-opacity-50"
                  title={tbl.text}
                />
              ))}

              {/* Formula highlights (Light Sky Blue) */}
              {toggles.formulas && formulaHighlights.filter(frm => frm.page === pageIndex).map((frm, i) => (
                <div
                  key={`formula-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('formula', 'Formula', frm.text, pageIndex, frm)}
                  style={{ position: 'absolute', ...styleFromRel(frm), backgroundColor: 'rgba(135, 206, 250, 0.3)', border: '1px solid lightskyblue' }}
                  className="cursor-pointer mix-blend-multiply hover:bg-opacity-50"
                  title={frm.text}
                />
              ))}

              {/* Code highlights (Light Coral) */}
              {toggles.codes && codeHighlights.filter(cd => cd.page === pageIndex).map((cd, i) => (
                <div
                  key={`code-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('code', 'Code', cd.text, pageIndex, cd)}
                  style={{ position: 'absolute', ...styleFromRel(cd), backgroundColor: 'rgba(240, 128, 128, 0.3)', border: '1px solid lightcoral' }}
                  className="cursor-pointer mix-blend-multiply hover:bg-opacity-50"
                  title={cd.text}
                />
              ))}

              {/* Furniture highlights (Light Grey) */}
              {toggles.furniture && furnitureHighlights.filter(furn => furn.page === pageIndex).map((furn, i) => (
                <div
                  key={`furniture-${pageIndex}-${i}`}
                  onClick={() => selectTextEntity('furniture', 'Furniture', furn.text, pageIndex, furn)}
                  style={{ position: 'absolute', ...styleFromRel(furn), backgroundColor: 'rgba(211, 211, 211, 0.3)', border: '1px solid lightgrey' }}
                  className="cursor-pointer mix-blend-multiply hover:bg-opacity-50"
                  title={furn.text}
                />
              ))}
            </>
          )}
          {/* Render Citation Popover if active for this page */}
          {activePopoverInfo && activePopoverInfo.page === pageIndex && (
            <CitationPopover
              content={activePopoverInfo.content}
              position={activePopoverInfo.position}
              onClose={() => setActivePopoverInfo(null)}
            />
          )}
          {/* Render Figure Popover if active for this page */}
          {activeFigurePopoverInfo && activeFigurePopoverInfo.page === pageIndex && (
            <FigurePopover
              caption={activeFigurePopoverInfo.caption}
              position={activeFigurePopoverInfo.position}
              onClose={() => setActiveFigurePopoverInfo(null)}
            />
          )}
        </Overlay>
      ))}
    </>
  );
};

export default React.memo(OverlayRenderer);
