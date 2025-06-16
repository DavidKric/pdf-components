import React, { useContext, useState } from 'react';
import { DocumentContext, Overlay as PdfOverlay, scrollToId } from '@davidkric/pdf-components';
import { TransformContext } from '@davidkric/pdf-components';
import { relativeToAbsoluteBox, RelativeBBox } from './bboxUtils';
import SelectionOverlay from './SelectionOverlay';
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
  selectionMode: boolean;
  onEntitySelect: (entity: { type: string; label: string; content?: string; page?: number; coords?: any } | null) => void;
  onRegionSelect: (entity: { type: string; label: string; content?: string; page?: number; coords?: any } | null) => void;
  onlyPage?: number;
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
          {/* Citation reference overlays (click to scroll to bibliography) */}
          {citationLinks.filter(c => c.page === pageIndex && !c.isAnchor).map((c, i) => (
            <div
              key={`cite-${pageIndex}-${i}`}
              onClick={() => scrollToId(c.refId)}
              title={`Go to reference ${c.refId.replace('ref-', '')}`}
              style={{ position: 'absolute', ...styleFromRel(c) }}
              className="bg-blue-100 bg-opacity-25 cursor-pointer mix-blend-multiply"
            />
          ))}
          {/* Citation anchors (targets for scrolling, not clickable) */}
          {citationLinks.filter(c => c.page === pageIndex && c.isAnchor).map((c, i) => (
            <div 
              key={`citeAnchor-${pageIndex}-${i}`} 
              id={c.refId}
              style={{ position: 'absolute', ...styleFromRel(c) }} 
            />
          ))}

          {/* Figure reference overlays (click to scroll to figure) */}
          {figureLinks.filter(f => f.page === pageIndex && !f.isAnchor).map((f, i) => (
            <div
              key={`fig-${pageIndex}-${i}`}
              onClick={() => scrollToId(f.figId)}
              title={`View Figure ${f.figId.replace('fig-', '')}`}
              style={{ position: 'absolute', ...styleFromRel(f) }}
              className="bg-purple-100 bg-opacity-30 cursor-pointer mix-blend-multiply"
            />
          ))}
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
              className="bg-orange-300 bg-opacity-20 cursor-pointer mix-blend-multiply"
            />
          ))}

          {/* Paragraph highlights (light yellow area covering paragraph block) */}
          {toggles.paragraphs && paragraphHighlights.filter(p => p.page === pageIndex).map((para, i) => (
            <div 
              key={`para-${pageIndex}-${i}`}
              onClick={() => selectTextEntity('paragraph', 'Paragraph', para.text, pageIndex, para)}
              style={{ position: 'absolute', ...styleFromRel(para) }}
              className="bg-yellow-300 bg-opacity-10 cursor-pointer mix-blend-multiply"
            />
          ))}

          {/* Section header highlights (red) */}
          {toggles.sectionHeaders && headerHighlights.filter(h => h.page === pageIndex).map((hdr, i) => (
            <div 
              key={`hdr-${pageIndex}-${i}`}
              onClick={() => selectTextEntity('sectionHeader', 'Section Header', hdr.text, pageIndex, hdr)}
              style={{ position: 'absolute', ...styleFromRel(hdr) }}
              className="bg-red-200 bg-opacity-25 cursor-pointer mix-blend-multiply"
            />
          ))}

          {/* Title highlights (teal) */}
          {toggles.titles && titleHighlights.filter(ti => ti.page === pageIndex).map((ttl, i) => (
            <div 
              key={`title-${pageIndex}-${i}`}
              onClick={() => selectTextEntity('title', 'Title', ttl.text, pageIndex, ttl)}
              style={{ position: 'absolute', ...styleFromRel(ttl) }}
              className="bg-teal-200 bg-opacity-20 cursor-pointer mix-blend-multiply"
            />
          ))}

          {/* Caption highlights (pink) */}
          {toggles.captions && captionHighlights.filter(c => c.page === pageIndex).map((cap, i) => (
            <div 
              key={`cap-${pageIndex}-${i}`}
              onClick={() => selectTextEntity('caption', 'Caption', cap.text, pageIndex, cap)}
              style={{ position: 'absolute', ...styleFromRel(cap) }}
              className="bg-pink-200 bg-opacity-20 cursor-pointer mix-blend-multiply"
            />
          ))}

          {/* Footnote highlights (purple) */}
          {toggles.footnotes && footnoteHighlights.filter(f => f.page === pageIndex).map((ft, i) => (
            <div 
              key={`foot-${pageIndex}-${i}`}
              onClick={() => selectTextEntity('footnote', 'Footnote', ft.text, pageIndex, ft)}
              style={{ position: 'absolute', ...styleFromRel(ft) }}
              className="bg-purple-300 bg-opacity-20 cursor-pointer mix-blend-multiply"
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
        </Overlay>
      ))}
    </>
  );
};

export default OverlayRenderer;
