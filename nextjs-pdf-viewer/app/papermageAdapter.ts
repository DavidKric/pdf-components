import type {
  DoclingDocument,
  GroupItem,
  RefItem,
  PictureItem,
  BoundingBox as DoclingBBox,
} from '@docling/docling-core';

// Generic rectangle box on a PDF page (coordinates in Docling points)
export type Box = {
  page: number;      // zero-based page index
  top: number;       // distance from **top** edge of rendered page (so origin top-left)
  left: number;      // distance from left edge
  width: number;     // box width
  height: number;    // box height
};

// Box that carries raw token text (for hover / a11y)
export type TokenBox = Box & { text: string };

// Clickable anchor or link (citations / figure refs)
export type LinkBox = Box & {
  refId?: string;    // e.g. "ref-12"
  figId?: string;    // e.g. "fig-3"
  isAnchor?: boolean;// whether the box is the scroll target rather than the clickable link
};

// Exhaustive overlay lists returned by the adapter
export interface OverlayData {
  tokenBoxes: TokenBox[];
  lineBoxes: Box[];
  paragraphBoxes: Box[];
  headerBoxes: Box[];
  titleBoxes: Box[];
  captionBoxes: Box[];
  footnoteBoxes: Box[];
  citationLinks: LinkBox[];
  figureLinks: LinkBox[];
}

/* --------------------------------------------------------------------------
 * Helper: compute horizontal segment – in absolute PDF coords – given the
 *         start + end **character indices** inside a line and the line's
 *         bounding box (DoclingBBox uses bottom-origin y-axis).
 * ------------------------------------------------------------------------ */
function segmentPosition(
  lineText: string,
  segStart: number,
  segEnd: number,
  lineBBox: DoclingBBox
) {
  const textNoSpace = lineText.replace(/ /g, '');
  const totalLen = textNoSpace.length || 1;
  const prefixLen = lineText.slice(0, segStart).replace(/ /g, '').length;
  const segmentLen = lineText.slice(segStart, segEnd).replace(/ /g, '').length;

  const ratioStart = prefixLen / totalLen;
  const ratioEnd   = (prefixLen + segmentLen) / totalLen;

  const { l: lineLeft, r: lineRight } = lineBBox;
  const left  = lineLeft + ratioStart * (lineRight - lineLeft);
  const width = (ratioEnd - ratioStart) * (lineRight - lineLeft);

  return { left, width };
}

/* --------------------------------------------------------------------------
 * Main adapter – walk the Docling structure and derive every overlay list
 * needed by the PaperMage demo UI. All maths stay in **un-scaled PDF units**.
 * ------------------------------------------------------------------------ */
export function extractOverlayData(docData: DoclingDocument): OverlayData {
  const tokenBoxes: TokenBox[] = [];
  const lineBoxes: Box[] = [];
  const paragraphBoxes: Box[] = [];
  const headerBoxes: Box[] = [];
  const titleBoxes: Box[] = [];
  const captionBoxes: Box[] = [];
  const footnoteBoxes: Box[] = [];
  const citationLinks: LinkBox[] = [];
  const figureLinks: LinkBox[] = [];

  // Build quick page-height lookup for Y-axis flip (Docling origin bottom-left).
  const pageSizes = (docData.pages ? Object.values<any>(docData.pages) : [])
    .sort((a: any, b: any) => (a.page_no || 0) - (b.page_no || 0))
    .map((p: any) => p.size ?? { width: 612, height: 792 });

  /* ----------------------------------------------------------------------
   * TEXT ITEMS ----------------------------------------------------------- */
  docData.texts?.forEach(item => {
    const { label, prov, text: content } = item as any;
    if (!prov?.length || !prov[0]?.bbox) return;

    const bbox = prov[0].bbox;
    const pageIdx = prov[0].page_no - 1;
    const pageHeight = pageSizes[pageIdx]?.height ?? 792;
    const { t: topY, b: bottomY, l: leftX, r: rightX } = bbox;
    const elemHeight = topY - bottomY;
    const elemWidth  = rightX - leftX;

    // Flip Y axis so that 0,0 is top-left like the pdf-components renderer
    const boxTop = pageHeight - topY;

    // ---------------- block-level categories ----------------
    if (label === 'text' || label === 'paragraph') {
      // Paragraph heuristic: long texts or explicit label
      if (label === 'paragraph' || (label === 'text' && content && content.length > 100)) {
        paragraphBoxes.push({ page: pageIdx, top: boxTop, left: leftX, width: elemWidth, height: elemHeight });
      }
    }
    if (label === 'section_header') {
      headerBoxes.push({ page: pageIdx, top: boxTop, left: leftX, width: elemWidth, height: elemHeight });
    }
    if (label === 'title') {
      titleBoxes.push({ page: pageIdx, top: boxTop, left: leftX, width: elemWidth, height: elemHeight });
    }
    if (label === 'caption') {
      captionBoxes.push({ page: pageIdx, top: boxTop, left: leftX, width: elemWidth, height: elemHeight });
    }
    if (label === 'footnote') {
      footnoteBoxes.push({ page: pageIdx, top: boxTop, left: leftX, width: elemWidth, height: elemHeight });
    }

    // Stop early if no textual content (image placeholder etc.)
    if (!content) return;

    // ---------------- fine-grained (lines + tokens) ----------------
    const lines = content.split('\n');
    const lineHeight = lines.length > 1 ? elemHeight / lines.length : elemHeight;

    lines.forEach((lineText: string, lineIndex: number) => {
      const lineTopY = topY - lineIndex * lineHeight; // Docling coords (bottom-origin)
      const lineBBox: DoclingBBox = { l: leftX, r: rightX, t: lineTopY, b: lineTopY - lineHeight };

      // Row overlay
      lineBoxes.push({
        page: pageIdx,
        top: pageHeight - lineTopY,
        left: leftX,
        width: rightX - leftX,
        height: lineHeight,
      });

      // Token overlay
      const tokens = lineText.trim().split(/\s+/).filter(Boolean);
      let charCountSoFar = 0;
      tokens.forEach((tokenText: string) => {
        const tokenLen   = tokenText.replace(/ /g, '').length;
        const startChar  = charCountSoFar;
        const endChar    = charCountSoFar + tokenLen;
        charCountSoFar  += tokenLen;

        const { left, width } = segmentPosition(lineText, startChar, endChar, lineBBox);
        tokenBoxes.push({
          page: pageIdx,
          top: pageHeight - lineTopY,
          left,
          width,
          height: lineHeight,
          text: tokenText,
        });
      });

      // ---------------- citation + figure references -------------
      const citationPattern = /\[(\d+(?:[\-,]\s*\d+)*)\]/g;
      let citeMatch: RegExpExecArray | null;
      while ((citeMatch = citationPattern.exec(lineText)) !== null) {
        const matchIndex = citeMatch.index;
        const matchEnd   = matchIndex + citeMatch[0].length;
        const { left: citeLeft, width: citeWidth } = segmentPosition(lineText, matchIndex, matchEnd, lineBBox);
        const targetNum = citeMatch[1].split(/[\-,]/)[0].trim();
        citationLinks.push({
          page: pageIdx,
          top: pageHeight - lineTopY,
          left: citeLeft,
          width: citeWidth,
          height: lineHeight,
          refId: `ref-${targetNum}`,
        });
      }

      const figPattern = /Figure\s+(\d+)(?!:)/g;
      let figMatch: RegExpExecArray | null;
      while ((figMatch = figPattern.exec(lineText)) !== null) {
        const figNum    = figMatch[1];
        const matchIndex= figMatch.index;
        const matchEnd  = matchIndex + `Figure ${figNum}`.length;
        const { left: figLeft, width: figWidth } = segmentPosition(lineText, matchIndex, matchEnd, lineBBox);
        figureLinks.push({
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

  /* ----------------------------------------------------------------------
   * ANCHORS (reference entries + figures) -------------------------------- */
  // Reference list items as anchors
  docData.groups?.forEach((group: GroupItem) => {
    if ((group.label === 'list' || group.label === 'ordered_list') && group.parent?.$ref === '#/body') {
      group.children?.forEach((refChild: RefItem) => {
        const refItem = docData.texts?.find(t => t.self_ref === refChild.$ref);
        if (refItem?.orig?.startsWith('[') && refItem.prov?.[0]?.bbox) {
          const match = refItem.orig.match(/^\[(\d+)\]/);
          if (match) {
            const refNum     = match[1];
            const bbox       = refItem.prov[0].bbox;
            const pageIdx    = refItem.prov[0].page_no - 1;
            const pageHeight = pageSizes[pageIdx]?.height ?? 792;
            citationLinks.push({
              page: pageIdx,
              top: pageHeight - bbox.t,
              left: bbox.l,
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

  // Figure location anchors
  docData.pictures?.forEach((picture: PictureItem) => {
    if (!picture.prov?.[0]?.bbox) return;
    const bbox       = picture.prov[0].bbox;
    const pageIdx    = picture.prov[0].page_no - 1;
    const pageHeight = pageSizes[pageIdx]?.height ?? 792;
    if (picture.captions?.length) {
      const capText = docData.texts?.find(t => t.self_ref === picture.captions?.[0].$ref)?.orig || '';
      const match = capText.match(/^Figure\s+(\d+)/);
      if (match) {
        const figNum = match[1];
        figureLinks.push({
          page: pageIdx,
          top: pageHeight - bbox.t,
          left: bbox.l,
          width: 1,
          height: 1,
          figId: `fig-${figNum}`,
          isAnchor: true,
        });
      }
    }
  });

  return {
    tokenBoxes,
    lineBoxes,
    paragraphBoxes,
    headerBoxes,
    titleBoxes,
    captionBoxes,
    footnoteBoxes,
    citationLinks,
    figureLinks,
  };
} 