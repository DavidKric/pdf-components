'use client';

import React, { useEffect, useRef, useState } from 'react';

// **TypeScript note:** Declare custom element types for JSX to avoid TS errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'docling-img': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pagenumbers?: boolean;
        src?: any;
        items?: any[];
      };
      'docling-tooltip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      // (We could include <docling-overlay> or others if used)
    }
  }
}

const App: React.FC = () => {
  // State for loaded Docling JSON document
  const [docData, setDocData] = useState<any>(null);
  // State for overlay layer toggles
  const [overlays, setOverlays] = useState({
    tokens: false,
    lines: false,
    paragraphs: false,
    sectionHeaders: false,
    titles: false,
    captions: false,
    footnotes: false
  });
  
  // State to track if we're on client side and components are loaded
  const [isClient, setIsClient] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  // Refs for the docling image component (for setting src, items, and controlling scroll)
  const docImgRef = useRef<HTMLElement>(null);

  // We will collect special overlay items for citations and figure refs
  const [citationOverlays, setCitationOverlays] = useState<any[]>([]);
  const [figureOverlays, setFigureOverlays] = useState<any[]>([]);

  // Set client side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load docling components only on client side
  useEffect(() => {
    if (!isClient) return;
    
    const loadComponents = async () => {
      try {
        // @ts-ignore - Dynamic import of untyped module
        await import('@docling/docling-components');
        setComponentsLoaded(true);
      } catch (error) {
        console.error('Failed to load docling components:', error);
      }
    };
    
    loadComponents();
  }, [isClient]);

  // Fetch the Docling JSON on mount
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch('/2408.09869v3.json');  // path to the Docling JSON
        const json = await res.json();
        setDocData(json);
      } catch (err) {
        console.error('Failed to load Docling JSON:', err);
      }
    };
    fetchDoc();
  }, []);

  // After Docling JSON is loaded, assign it to the <docling-img> component
  useEffect(() => {
    if (docData && docImgRef.current) {
      // Set the document data as the source for docling-img
      (docImgRef.current as any).src = docData;
      // Also prepare always-on citation/figure overlays
      prepareInteractiveOverlays(docData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docData]);

  // Prepare citation and figure reference overlay items from the doc content
  const prepareInteractiveOverlays = (doc: any) => {
    const citationItems: any[] = [];
    const figureItems: any[] = [];

    if (!doc) return;
    // We will use paragraphs and section headers text to find references
    const textItems: any[] = [];
    if (doc.paragraphs) textItems.push(...doc.paragraphs);
    if (doc.section_headers) textItems.push(...doc.section_headers);
    if (doc.titles) textItems.push(...doc.titles);
    // (Titles likely just one main title, included for completeness)

    // Regex patterns for citations and figure refs:
    const citationPattern = /\[\s*\d+([,\-\s]+\d+)*\]/g;  // matches "[1]", "[1, 2]", "[1-3]" etc.
    const figurePattern = /\bFig(?:ure)?\.?\s+\d+/gi;      // matches "Figure 1", "Fig. 2", case-insensitive

    textItems.forEach(item => {
      const content: string = item.text || item.content || '';
      if (!content) return;
      // Go through all matches in this item's text
      let match;
      // Citations:
      while ((match = citationPattern.exec(content)) !== null) {
        const citeText = match[0];
        const citeIndexStr = citeText.replace(/[\[\]\s]/g, '');  // e.g. "[12]" -> "12" or "[1,2]" -> "1,2"
        // If multiple numbers (e.g. "1,2"), take the first for scroll (simple approach)
        const citeNum = parseInt(citeIndexStr.split(/,|-/)[0], 10);
        if (!isNaN(citeNum)) {
          const overlayItem = createOverlayItemForSpan(item, match.index, match.index + citeText.length);
          overlayItem.customType = 'citation';
          overlayItem.refIndex = citeNum;  // reference number to scroll to
          overlayItem.label = 'FOOTNOTE';  // label as footnote for styling (citation marker)
          citationItems.push(overlayItem);
        }
      }
      // Figure references:
      while ((match = figurePattern.exec(content)) !== null) {
        const figRefText = match[0];  // e.g. "Figure 2"
        // Extract the figure number from the matched text (last number in the string)
        const numMatch = figRefText.match(/(\d+)(?!.*\d)/);
        const figNum = numMatch ? parseInt(numMatch[1], 10) : NaN;
        if (!isNaN(figNum)) {
          const overlayItem = createOverlayItemForSpan(item, match.index, match.index + figRefText.length);
          overlayItem.customType = 'figure';
          overlayItem.figNumber = figNum;
          overlayItem.label = 'TEXT';  // label as generic text highlight
          figureItems.push(overlayItem);
        }
      }
    });

    setCitationOverlays(citationItems);
    setFigureOverlays(figureItems);
  };

  // Helper: create an overlay item for a text span given the parent item and character indices
  const createOverlayItemForSpan = (parentItem: any, charStart: number, charEnd: number) => {
    // Determine which provenance segment covers the span (Docling items may have multiple prov entries for multiple lines)
    let provEntry = null;
    if (parentItem.prov) {
      // Find prov entry whose charspan covers the start index
      for (const prov of parentItem.prov) {
        if (prov.charspan && prov.charspan.length === 2) {
          const [start, end] = prov.charspan;
          if (charStart >= start && charStart < end) {
            provEntry = prov;
            break;
          }
        }
      }
    }
    // If we found the specific line (prov) containing the span, use its bounding box; otherwise default to parent's first prov
    const targetProv = provEntry || (parentItem.prov ? parentItem.prov[0] : null);
    // Create a shallow copy of the prov entry (to avoid mutating original)
    const provCopy = targetProv ? { ...targetProv } : {};
    // (For simplicity, we use the entire prov's bbox as the clickable region. 
    // This covers the whole line containing the span. Precise word-level boxing can be added if needed.)
    return { ...provCopy, prov: [provCopy] };
  };

  // When overlay toggles change, update the docling-img `items` property to show/hide layers
  useEffect(() => {
    if (!docData || !docImgRef.current) return;
    const itemsToShow: any[] = [];
    const d = docData;
    if (overlays.tokens && d.tokens) {
      itemsToShow.push(...d.tokens);
    }
    if (overlays.lines && d.lines) {
      itemsToShow.push(...d.lines);
    }
    if (overlays.paragraphs && d.paragraphs) {
      itemsToShow.push(...d.paragraphs);
    }
    if (overlays.sectionHeaders && d.section_headers) {
      itemsToShow.push(...d.section_headers);
    }
    if (overlays.titles) {
      if (d.titles) itemsToShow.push(...d.titles);
      if (d.title) itemsToShow.push(d.title);
    }
    if (overlays.captions && d.captions) {
      itemsToShow.push(...d.captions);
    }
    if (overlays.footnotes && d.footnotes) {
      itemsToShow.push(...d.footnotes);
      if (d.references) {
        itemsToShow.push(...d.references);  // include reference list entries as footnotes, if present
      }
    }
    // Always include citation and figure reference overlays (to keep them clickable at all times)
    itemsToShow.push(...citationOverlays, ...figureOverlays);

    // Update the docling-img component's items to highlight
    (docImgRef.current as any).items = itemsToShow;
  }, [overlays, docData, citationOverlays, figureOverlays]);

  // Scroll to a given page number (1-indexed) within the docling-img content
  const scrollToPage = (pageNum: number) => {
    const cmp = docImgRef.current as HTMLElement;
    if (!cmp) return;
    // Try to find the page image element in shadow DOM
    const shadow = (cmp.shadowRoot || cmp);
    const pageImg = shadow.querySelector(`img[data-page-number="${pageNum}"]`) as HTMLElement;
    if (pageImg) {
      pageImg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback: scroll roughly by page height if image not found
      cmp.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to reference entry number `refIndex` (1-indexed)
  const scrollToReference = (refIndex: number) => {
    if (!docData || !docData.references) return;
    const refItem = docData.references[refIndex - 1];
    if (refItem && refItem.prov && refItem.prov[0]) {
      const page = refItem.prov[0].page_no;
      scrollToPage(page);
      // (Optionally, one could highlight or flash the reference item here)
    }
  };

  // Scroll to the figure with number `figNumber`
  const scrollToFigure = (figNumber: number) => {
    if (!docData) return;
    // Find caption or picture containing "Figure figNumber"
    let targetItem = null;
    if (docData.captions) {
      targetItem = docData.captions.find((cap: any) => {
        const text: string = cap.text || cap.content || '';
        return text.match(new RegExp(`Figure\\s+${figNumber}\\b`));
      });
    }
    if (!targetItem && docData.pictures) {
      // As a fallback, use picture by index (figNumber likely corresponds to index in pictures if in order)
      targetItem = docData.pictures[figNumber - 1];
    }
    if (targetItem && targetItem.prov && targetItem.prov[0]) {
      const page = targetItem.prov[0].page_no;
      scrollToPage(page);
    }
  };

  // Handle click events on highlighted overlays
  useEffect(() => {
    const cmp = docImgRef.current;
    if (!cmp) return;
    // Event handler for item clicks
    const handleItemClick = (event: any) => {
      const detail = event.detail;
      if (!detail) return;
      // The event detail may contain the clicked item or items
      let clickedItem = detail.item || detail.items || detail;
      // If an array of items is provided (detail.items), use the first item
      if (Array.isArray(clickedItem)) {
        clickedItem = clickedItem[0];
      }
      if (!clickedItem) return;
      if (clickedItem.customType === 'citation') {
        const refNum = clickedItem.refIndex;
        scrollToReference(refNum);
      } else if (clickedItem.customType === 'figure') {
        const figNum = clickedItem.figNumber;
        scrollToFigure(figNum);
      }
      // (No special action on clicking other overlays beyond these)
    };
    // Listen for custom selection events from docling-img
    cmp.addEventListener('item-click', handleItemClick as EventListener);
    cmp.addEventListener('itemClick', handleItemClick as EventListener);
    cmp.addEventListener('click', handleItemClick as EventListener);
    return () => {
      cmp.removeEventListener('item-click', handleItemClick as EventListener);
      cmp.removeEventListener('itemClick', handleItemClick as EventListener);
      cmp.removeEventListener('click', handleItemClick as EventListener);
    };
  }, [docImgRef, docData]);

  // Toggle handler for checkboxes
  const onToggleChange = (layer: string) => {
    setOverlays(prev => ({ ...prev, [layer]: !prev[layer as keyof typeof prev] }));
  };

  // Early return for SSR
  if (!isClient) {
    return (
      <div className="app-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top toolbar with overlay toggles - positioned below the navbar */}
      <div className="fixed top-12 left-0 right-0 h-12 bg-gray-800 text-gray-100 flex items-center px-4 z-40 shadow" style={{ top: '48px' }}>
        <strong className="text-yellow-400 mr-4">Overlays:</strong>
        {Object.keys(overlays).map(layer => (
          <label key={layer} className="mr-3 flex items-center text-sm">
            <input 
              type="checkbox" 
              className="mr-1"
              checked={overlays[layer as keyof typeof overlays]} 
              onChange={() => onToggleChange(layer)} 
            />
            <span>{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
          </label>
        ))}
      </div>

      {/* Document viewer container - positioned below both navbars */}
      <div className="doc-container" style={{ paddingTop: '96px' }}>
        {/* Loading indicator for components or data */}
        {(!componentsLoaded || !docData) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">
              {!componentsLoaded ? 'Loading Docling components...' : 'Loading document...'}
            </div>
          </div>
        )}
        
        {/* Docling components - only render when everything is loaded */}
        {componentsLoaded && docData && (
          <>
            <docling-img ref={docImgRef} pagenumbers></docling-img>
            <docling-tooltip></docling-tooltip>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
