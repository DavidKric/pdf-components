import React, { useEffect, useRef, useState } from 'react';
import '@docling/docling-components';

// Define types for the Docling document structure (partial, for clarity)
interface BoundingBox { l: number; t: number; r: number; b: number; }
interface DoclingItem { 
  label: string; 
  content?: string; 
  text?: string; 
  bbox: BoundingBox; 
  page_idx?: number; 
}
interface DoclingPage { width: number; height: number; items: DoclingItem[]; }
interface DoclingDocument { pages: DoclingPage[]; pictures?: DoclingItem[]; tables?: DoclingItem[]; }

// Component props: expect a DoclingDocument JSON and optional styling parameters
interface PDFViewerDemoProps { doc: DoclingDocument; style?: React.CSSProperties; }

const PDFViewerDemoDoclingComponents: React.FC<PDFViewerDemoProps> = ({ doc, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);  // Type as HTMLDivElement because DoclingImg is a custom element
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [highlights, setHighlights] = useState<Array<{
    type: 'citation' | 'figure',
    pageIndex: number,
    top: number, left: number, width: number, height: number,
    targetPageIndex?: number, targetY?: number
  }>>([]);
  const pageOffsetsRef = useRef<number[]>([]);  // cumulative offsets of each page for scrolling
  const scaleRef = useRef<number>(1);

  // Compute page scale and offsets once doc is loaded
  useEffect(() => {
    if (!doc || !doc.pages || doc.pages.length === 0 || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const pageWidth = doc.pages[0].width || containerWidth;
    const scale = containerWidth / pageWidth;
    scaleRef.current = scale;
    // Compute cumulative page height offsets (in original doc units)
    const offsets: number[] = [];
    let cumulative = 0;
    doc.pages.forEach(page => {
      offsets.push(cumulative);
      cumulative += page.height;
    });
    pageOffsetsRef.current = offsets;
  }, [doc]);

  // Set up always-on highlights for citations and figure references
  useEffect(() => {
    if (!doc || !doc.pages) return;
    const newHighlights: typeof highlights = [];
    const refItems: DoclingItem[] = [];   // bibliography reference items (label 'reference')
    // Gather bibliography reference items (assuming label or content identification)
    for (const page of doc.pages) {
      for (const item of page.items || []) {
        if (item.label === 'reference' || item.label === 'reference_entry') {
          refItems.push({ ...item, page_idx: pageOffsetsRef.current.indexOf(pageOffsetsRef.current.find(off => off === undefined)!) }); 
          // ^ above: find page index for this reference item (simplified: find this page's index)
        }
      }
    }
    // Iterate over all text items to find citations and figure refs
    doc.pages.forEach((page, pIndex) => {
      for (let i = 0; i < (page.items?.length || 0); i++) {
        const item = page.items[i];
        if (!item.content && !item.text) continue;
        const text = item.content || item.text || '';
        // Identify numeric citation like "[123]"
        const citationMatch = text.match(/^\[(\d+)\]$/);
        if (citationMatch) {
          const citeNum = parseInt(citationMatch[1], 10);
          // Calculate highlight box position
          const { l, t, r, b } = item.bbox;
          const highlight: any = {
            type: 'citation',
            pageIndex: pIndex,
            left: l * scaleRef.current,
            top: (pageOffsetsRef.current[pIndex] + t) * scaleRef.current,
            width: (r - l) * scaleRef.current,
            height: (b - t) * scaleRef.current
          };
          // Find target reference entry page (if exists)
          const refItem = refItems.find(ref => {
            // Check if reference item starts with the same number (e.g., "1." or "[1]")
            const refText = ref.content || ref.text || '';
            return refText.startsWith(citationMatch[1]);
          });
          if (refItem && typeof refItem.page_idx !== 'undefined') {
            highlight.targetPageIndex = refItem.page_idx;
            highlight.targetY = refItem.bbox.t;
          }
          newHighlights.push(highlight);
        }
        // Identify figure references like "Figure 3" or "Fig. 3"
        const figMatch = text.match(/^Fig(?:ure)?\.?\s+(\d+)/i);
        if (figMatch) {
          const figNum = parseInt(figMatch[1], 10);
          const { l, t, r, b } = item.bbox;
          const highlight: any = {
            type: 'figure',
            pageIndex: pIndex,
            left: l * scaleRef.current,
            top: (pageOffsetsRef.current[pIndex] + t) * scaleRef.current,
            width: (r - l) * scaleRef.current,
            height: (b - t) * scaleRef.current
          };
          // Find target figure (picture) page via doc.pictures list if available
          if (doc.pictures && figNum >= 1 && figNum <= doc.pictures.length) {
            const picItem = doc.pictures[figNum - 1];
            if (picItem && typeof picItem.page_idx !== 'undefined') {
              highlight.targetPageIndex = picItem.page_idx;
              highlight.targetY = picItem.bbox.t;
            }
          }
          newHighlights.push(highlight);
        }
      }
    });
    setHighlights(newHighlights);
  }, [doc]);

  // Listen for text selection changes to update metadata panel
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!containerRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const selectedStr = sel.toString();
      if (!selectedStr) {
        // No text selected (selection cleared)
        setSelectedText('');
        setSelectedCoords(null);
        return;
      }
      // Ensure the selection is within our viewer container
      const anchNode = sel.anchorNode;
      if (anchNode && containerRef.current.contains(anchNode instanceof Text ? anchNode.parentNode : anchNode)) {
        // Compute bounding box of selection relative to container
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;
        const w = rect.width;
        const h = rect.height;
        // Convert to document coordinates (unscaled, top-left origin)
        const docX = scaleRef.current !== 0 ? (x / scaleRef.current) : x;
        const docY = scaleRef.current !== 0 ? (y / scaleRef.current) : y;
        const docW = scaleRef.current !== 0 ? (w / scaleRef.current) : w;
        const docH = scaleRef.current !== 0 ? (h / scaleRef.current) : h;
        setSelectedText(selectedStr);
        setSelectedCoords({ x: parseFloat(docX.toFixed(2)), y: parseFloat(docY.toFixed(2)), w: parseFloat(docW.toFixed(2)), h: parseFloat(docH.toFixed(2)) });
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Scroll to a specific page (and optional Y offset within page)
  const scrollToPage = (pageIndex: number, yOffset: number = 0) => {
    const container = containerRef.current;
    if (!container || !doc.pages[pageIndex]) return;
    const pageOffsetY = pageOffsetsRef.current[pageIndex] * scaleRef.current;
    container.scrollTo({ top: pageOffsetY + yOffset * scaleRef.current, behavior: 'smooth' });
  };

  // Click handler for citation/figure highlight overlays
  const handleHighlightClick = (hl: typeof highlights[number]) => {
    if (typeof hl.targetPageIndex !== 'undefined') {
      scrollToPage(hl.targetPageIndex, hl.targetY || 0);
    }
  };

  // Render the layout: sidebar, main viewer, metadata panel
  return (
    <div style={{ display: 'flex', height: '100%', ...style }}>
      {/* Thumbnail Sidebar */}
      <div style={{ width: '120px', overflowY: 'auto', borderRight: '1px solid #ccc', padding: '4px' }}>
        {doc.pages.map((page, idx) => {
          // Use page image if available (assuming embedded base64 or URL in doc data), otherwise use DoclingImg snapshot
          // For simplicity, we assume doc.pages[idx].image contains a data URL or image source.
          const thumbSrc: string | undefined = (page as any).image;
          return (
            <div key={idx} style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => scrollToPage(idx)}>
              {thumbSrc ? (
                <img src={thumbSrc} alt={`Page ${idx+1}`} style={{ width: '100%', border: '1px solid #999' }} />
              ) : (
                <div style={{ width: '100%', paddingTop: '150%', background: '#eee', border: '1px solid #999' }}>
                  {/* Placeholder if no image available */}
                  <span style={{ position: 'absolute', left: 4, top: 4 }}>Page {idx+1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Document Viewer */}
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflowY: 'auto', background: '#f9f9f9' }}>
        {/* Docling image with overlay for actual PDF content */}
        <docling-img ref={imgRef} src={doc} pagenumbers style={{ width: '100%', height: 'auto' }}>
          <DoclingOverlay />
        </docling-img>
        {/* Always-on highlights overlay (absolute positioned boxes) */}
        {highlights.map((hl, index) => (
          <div
            key={index}
            onClick={() => handleHighlightClick(hl)}
            style={{
              position: 'absolute',
              left: `${hl.left}px`,
              top: `${hl.top}px`,
              width: `${hl.width}px`,
              height: `${hl.height}px`,
              background: hl.type === 'citation' ? 'rgba(255, 240, 140, 0.5)' : 'rgba(140, 200, 255, 0.4)',
              border: hl.type === 'citation' ? '1px solid gold' : '1px solid deepskyblue',
              cursor: hl.targetPageIndex !== undefined ? 'pointer' : 'default',
              pointerEvents: hl.targetPageIndex !== undefined ? 'auto' : 'none'
            }}
            title={hl.type === 'citation' ? 'Go to reference' : 'Go to figure'}
          />
        ))}
      </div>

      {/* Metadata Side Panel */}
      <div style={{ width: '250px', overflowY: 'auto', borderLeft: '1px solid #ccc', padding: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Selection Info</h3>
        {selectedText ? (
          <>
            <p><strong>Selected Text:</strong> <em>{selectedText}</em></p>
            {selectedCoords && (
              <p>
                <strong>Coordinates:</strong><br/>
                x = {selectedCoords.x}, y = {selectedCoords.y} <br/>
                width = {selectedCoords.w}, height = {selectedCoords.h}
              </p>
            )}
          </>
        ) : (
          <p><em>No text selected</em></p>
        )}
      </div>
    </div>
  );
};

export default PDFViewerDemoDoclingComponents;
