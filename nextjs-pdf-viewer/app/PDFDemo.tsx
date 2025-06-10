// PDFDemo.tsx
// This demo showcases all advanced PDF features using ONLY @davidkric/pdf-components.
// Do NOT use react-pdf, pdfjs-dist, or manual worker setup. All PDF logic must go through this library.
// Each feature is modular and toggleable for demonstration and development purposes.

'use client';

import React, { useContext, useState, useRef } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  RENDER_TYPE,
  Overlay,
  HighlightOverlay,
  BoundingBox,
  Outline,
  ThumbnailList,
  ZoomInButton,
  ZoomOutButton,
  TransformContext,
  PageNumberControl,
  scrollToId,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';

const PDF_URL = 'https://arxiv.org/pdf/2404.16130';

// Skimming highlight sample data
const skimmingHighlights = [
  { page: 3, top: 120, left: 100, width: 320, height: 28, label: 'Method', color: 'bg-yellow-200', tag: 'bg-yellow-600', text: 'Input/Output Representations' },
  { page: 3, top: 200, left: 120, width: 300, height: 28, label: 'Method', color: 'bg-yellow-200', tag: 'bg-yellow-600', text: 'WordPiece embeddings' },
  { page: 3, top: 250, left: 140, width: 280, height: 28, label: 'Goal', color: 'bg-blue-200', tag: 'bg-blue-600', text: 'BERT handle a variety of down-stream tasks' },
];
const citationCards = [
  { page: 3, top: 300, left: 100, width: 100, height: 25, label: 'Citation', color: 'bg-blue-200', tag: 'bg-blue-600', text: 'Wu et al., 2016', citation: { title: 'WordPiece Embeddings', authors: 'Wu et al.', year: 2016, abstract: 'A method for subword tokenization.' } },
];

interface FeatureToggles {
  outline: boolean;
  thumbnails: boolean;
  highlighting: boolean;
  overlay: boolean;
  citationPopovers: boolean;
  scrollTo: boolean;
  noteTaking: boolean;
  skimming: boolean;
  rightSidebar: boolean;
  tokens: boolean;
  rows: boolean;
  paragraphs: boolean;
  sectionHeaders: boolean;
  titles: boolean;
  captions: boolean;
  footnotes: boolean;
  textLayer: boolean;
}

function TopBar({ toggles, setToggles }: { toggles: FeatureToggles; setToggles: React.Dispatch<React.SetStateAction<FeatureToggles>> }) {
  const { scale } = useContext(TransformContext);
  return (
    <div className="flex flex-wrap items-center justify-between w-full bg-gray-900 text-white border-b px-6 py-2 shadow-sm fixed top-12 left-0 z-30 h-16 min-h-[56px]">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-bold text-lg text-yellow-400">Semantic Reader Demo</span>
        <button
          className={`px-2 py-1 rounded ${toggles.outline ? 'bg-gray-800 text-yellow-300' : 'hover:bg-gray-800'}`}
          onClick={() => setToggles(t => ({ ...t, outline: !t.outline }))}
          title="Toggle Table of Contents"
          aria-label="Toggle Table of Contents"
        >
          Table of Contents
        </button>
        <button
          className={`px-2 py-1 rounded ${toggles.thumbnails ? 'bg-gray-800 text-yellow-300' : 'hover:bg-gray-800'}`}
          onClick={() => setToggles(t => ({ ...t, thumbnails: !t.thumbnails }))}
          title="Toggle Thumbnails"
          aria-label="Toggle Thumbnails"
        >
          Thumbnails
        </button>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <ZoomOutButton />
        <span className="font-mono text-base">{(scale * 100).toFixed(0)}%</span>
        <ZoomInButton />
        <PageNumberControl />
      </div>
      <div className="flex items-center gap-2 flex-wrap border-l border-gray-700 pl-4 ml-4">
        <label className="flex items-center gap-1" title="Show AI-generated skimming highlights">
          <input type="checkbox" checked={toggles.skimming} onChange={e => setToggles(t => ({ ...t, skimming: e.target.checked }))} aria-label="Skimming Assist" />
          Skimming Assist
        </label>
        <label className="flex items-center gap-1" title="Show right sidebar with highlights and citations">
          <input type="checkbox" checked={toggles.rightSidebar} onChange={e => setToggles(t => ({ ...t, rightSidebar: e.target.checked }))} aria-label="Show Right Sidebar" />
          Right Sidebar
        </label>
        <label className="flex items-center gap-1" title="Show highlight overlay demo">
          <input type="checkbox" checked={toggles.highlighting} onChange={e => setToggles(t => ({ ...t, highlighting: e.target.checked }))} aria-label="Highlight" />
          Highlight
        </label>
        <label className="flex items-center gap-1" title="Show overlay demo">
          <input type="checkbox" checked={toggles.overlay} onChange={e => setToggles(t => ({ ...t, overlay: e.target.checked }))} aria-label="Overlay" />
          Overlay
        </label>
        <label className="flex items-center gap-1" title="Show citation popovers">
          <input type="checkbox" checked={toggles.citationPopovers} onChange={e => setToggles(t => ({ ...t, citationPopovers: e.target.checked }))} aria-label="Citations" />
          Citations
        </label>
        <label className="flex items-center gap-1" title="Show scroll-to demo">
          <input type="checkbox" checked={toggles.scrollTo} onChange={e => setToggles(t => ({ ...t, scrollTo: e.target.checked }))} aria-label="ScrollTo" />
          ScrollTo
        </label>
        <label className="flex items-center gap-1" title="Enable Hypothesis note taking">
          <input type="checkbox" checked={toggles.noteTaking} onChange={e => setToggles(t => ({ ...t, noteTaking: e.target.checked }))} aria-label="Notes" />
          Notes
        </label>
      </div>
    </div>
  );
}

function FeaturesBar({ toggles, setToggles }: { toggles: FeatureToggles & any; setToggles: React.Dispatch<React.SetStateAction<FeatureToggles & any>> }) {
  const toggleFeature = (key: string) => {
    setToggles((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed top-28 left-0 right-0 h-12 bg-gray-800 text-gray-100 flex items-center px-4 z-40 shadow border-b border-gray-700">
      <span className="font-bold text-sm text-yellow-400 mr-4">
        Advanced Features
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
          ['textLayer', 'Text Layer'],
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
  );
}

function Sidebar({ toggles, setToggles, activeTab, setActiveTab }: { toggles: FeatureToggles; setToggles: React.Dispatch<React.SetStateAction<FeatureToggles>>; activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="flex flex-col h-full w-72 bg-gray-900 text-white border-r shadow-lg pt-28 fixed left-0 top-0 z-20">
      <div className="flex flex-row w-full border-b border-gray-800">
        <button className={`flex-1 py-3 text-center font-semibold ${activeTab === 'thumbnails' ? 'bg-gray-800 text-yellow-300' : 'hover:bg-gray-800'}`} onClick={() => setActiveTab('thumbnails')}>Thumbnails</button>
        <button className={`flex-1 py-3 text-center font-semibold ${activeTab === 'toc' ? 'bg-gray-800 text-yellow-300' : 'hover:bg-gray-800'}`} onClick={() => setActiveTab('toc')}>Table Of Contents</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'thumbnails' && toggles.thumbnails && <ThumbnailList />}
        {activeTab === 'toc' && toggles.outline && <Outline />}
        {activeTab === 'toc' && !toggles.outline && <div className="text-gray-400 text-center mt-8">No Table of Contents found for this PDF.</div>}
      </div>
      <div className="p-2 border-t border-gray-800">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={toggles.skimming} onChange={e => setToggles(t => ({ ...t, skimming: e.target.checked }))} />Skimming Assist</label>
      </div>
    </div>
  );
}

function RightSidebar({ toggles, onSkimClick, onCitationClick }: { toggles: FeatureToggles; onSkimClick: (h: any) => void; onCitationClick: (c: any) => void }) {
  return (
    <div className="flex flex-col h-full w-80 bg-white border-l shadow-lg pt-28 fixed right-0 top-0 z-20">
      <div className="flex flex-row w-full border-b border-gray-200">
        <div className="flex-1 py-3 text-center font-semibold text-blue-700 bg-blue-50">Skimming Highlights</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="text-xs text-gray-500 mb-2">AI-generated highlighting to support skimming</div>
          {skimmingHighlights.map((h, i) => (
            <div key={i} className="mb-3 cursor-pointer hover:bg-blue-100 rounded p-2 flex items-center gap-2" onClick={() => onSkimClick(h)}>
              <span className={`px-2 py-1 text-xs font-bold text-white rounded-l ${h.tag}`}>{h.label}</span>
              <span className="text-xs text-gray-800">{h.text} <span className="text-gray-400">Page {h.page + 1}</span></span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-2">Citation Cards</div>
          {citationCards.map((c, i) => (
            <div key={i} className="mb-3 cursor-pointer hover:bg-blue-100 rounded p-2 flex items-center gap-2" onClick={() => onCitationClick(c)}>
              <span className={`px-2 py-1 text-xs font-bold text-white rounded-l ${c.tag}`}>{c.label}</span>
              <span className="text-xs text-gray-800">{c.text} <span className="text-gray-400">Page {c.page + 1}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PDFMainArea({ toggles, scrollToBox }: { toggles: FeatureToggles & any; scrollToBox: any }) {
  const { numPages } = useContext(DocumentContext);
  const highlightBoxes = [
    { page: 3, top: 100, left: 100, width: 200, height: 30 },
    { page: 3, top: 150, left: 120, width: 180, height: 25 },
  ];
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const targetPage = 3;
  const targetBox = { page: targetPage, top: 250, left: 200, width: 180, height: 60 };
  function useExternalScript(src: string, enabled: boolean) {
    React.useEffect(() => {
      if (!enabled) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) existing.remove();
        const annotatorLink = document.querySelector('link[type="application/annotator+html"]');
        if (annotatorLink) {
          const destroyEvent = new Event('destroy');
          annotatorLink.dispatchEvent(destroyEvent);
        }
        return;
      }
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
      }
      return () => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) existing.remove();
        const annotatorLink = document.querySelector('link[type="application/annotator+html"]');
        if (annotatorLink) {
          const destroyEvent = new Event('destroy');
          annotatorLink.dispatchEvent(destroyEvent);
        }
      };
    }, [src, enabled]);
  }
  useExternalScript('https://hypothes.is/embed.js', toggles.noteTaking);

  // Scroll to a bounding box (simulate by scrolling to page)
  React.useEffect(() => {
    if (scrollToBox && scrollToBox.page != null) {
      const el = document.querySelector(`[data-page-index="${scrollToBox.page}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [scrollToBox]);

  return (
    <div className={`pdf-reader__container flex-1 h-full bg-gray-100 pt-40 overflow-y-auto relative ${toggles.thumbnails ? 'ml-72' : 'ml-0'} ${toggles.rightSidebar ? 'mr-80' : 'mr-0'}`}>
      <DocumentWrapper file={PDF_URL} renderType={RENDER_TYPE.SINGLE_CANVAS}>
        <div className="pdf-reader__page-list">
          {Array.from({ length: numPages ?? 0 }).map((_, idx) => (
            <PageWrapper key={idx} pageIndex={idx} renderType={RENDER_TYPE.SINGLE_CANVAS}>
              <React.Fragment>
                {/* Skimming Highlights as bounding boxes */}
                {toggles.skimming && (
                  <Overlay>
                    {skimmingHighlights.filter(h => h.page === idx).map((h, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        top: h.top,
                        left: h.left,
                        width: h.width,
                        height: h.height,
                        background: 'rgba(255,255,0,0.35)',
                        borderRadius: 6,
                        border: '2px solid #facc15',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <span className={`px-2 py-1 text-xs font-bold text-white rounded-l ${h.tag}`} style={{marginRight: 8}}>{h.label}</span>
                        <span className="text-xs text-gray-800">{h.text}</span>
                      </div>
                    ))}
                  </Overlay>
                )}
                {/* Highlight Overlay */}
                {toggles.highlighting && (
                  <HighlightOverlay pageIndex={idx}>
                    {highlightBoxes.filter(box => box.page === idx).map((box, i) => (
                      <BoundingBox
                        key={i}
                        top={box.top}
                        left={box.left}
                        width={box.width}
                        height={box.height}
                        page={box.page}
                        isHighlighted={true}
                        className="bg-yellow-200 bg-opacity-50 border-yellow-400 border"
                      />
                    ))}
                  </HighlightOverlay>
                )}
                {/* Overlay Demo */}
                {toggles.overlay && (
                  <Overlay>
                    <div
                      style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        background: 'rgba(255,255,0,0.7)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontWeight: 'bold',
                      }}
                    >
                      Overlay on page {idx + 1}
                    </div>
                  </Overlay>
                )}
                {/* Citation Popovers as bounding boxes */}
                {toggles.citationPopovers && (
                  <Overlay>
                    {citationCards.filter(c => c.page === idx).map((c, i) => {
                      const popoverId = `citation-${idx}-${i}`;
                      return (
                        <div key={popoverId} style={{ position: 'absolute', top: c.top, left: c.left, width: c.width, height: c.height, zIndex: 20 }}>
                          <div
                            className="border-2 border-blue-600 bg-blue-100 bg-opacity-70 rounded cursor-pointer h-full w-full flex items-center justify-center text-xs font-bold text-blue-700 hover:bg-blue-200"
                            onClick={() => setOpenPopover(openPopover === popoverId ? null : popoverId)}
                          >
                            Cite
                          </div>
                          {openPopover === popoverId && (
                            <div
                              style={{
                                position: 'absolute',
                                top: c.height + 8,
                                left: 0,
                                zIndex: 30,
                                background: 'white',
                                border: '1px solid #2563eb',
                                borderRadius: 6,
                                boxShadow: '0 4px 16px rgba(37,99,235,0.15)',
                                padding: 16,
                                minWidth: 240,
                              }}
                            >
                              <div className="font-bold mb-1 text-blue-700">{c.citation.title}</div>
                              <div className="text-sm mb-1">{c.citation.authors} ({c.citation.year})</div>
                              <div className="text-xs text-gray-700 mb-2">{c.citation.abstract}</div>
                              <button
                                className="mt-2 text-xs text-blue-600 underline"
                                onClick={() => setOpenPopover(null)}
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Overlay>
                )}
                {/* ScrollTo Demo */}
                {toggles.scrollTo && idx === targetPage && (
                  <Overlay>
                    <button
                      className="absolute left-1/2 top-4 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                      onClick={() => scrollToId('demoFigure')}
                    >
                      Scroll to Figure
                    </button>
                    <BoundingBox
                      id="demoFigure"
                      top={targetBox.top}
                      left={targetBox.left}
                      width={targetBox.width}
                      height={targetBox.height}
                      page={targetBox.page}
                      isHighlighted={true}
                      className="border-red-500 border-2 bg-red-200 bg-opacity-40"
                    />
                    <span style={{
                      position: 'absolute',
                      left: targetBox.left,
                      top: targetBox.top,
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '0 0 6px 0',
                    }}>Figure</span>
                  </Overlay>
                )}
              </React.Fragment>
            </PageWrapper>
          ))}
        </div>
      </DocumentWrapper>
    </div>
  );
}

export default function PDFDemo() {
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({
    outline: true,
    thumbnails: true,
    highlighting: true,
    overlay: false,
    citationPopovers: true,
    scrollTo: false,
    noteTaking: false,
    skimming: true,
    rightSidebar: true,
    tokens: false,
    rows: false,
    paragraphs: false,
    sectionHeaders: false,
    titles: false,
    captions: false,
    footnotes: false,
    textLayer: false,
  });
  const [activeTab, setActiveTab] = useState('thumbnails');
  const [scrollToBox, setScrollToBox] = useState<any>(null);
  return (
    <ContextProvider>
      <div className="pdf-root fixed inset-0 w-screen h-screen">
        <div className="pdf-background absolute inset-0 bg-gray-900 z-0" />
        <div className="pdf-document-container absolute inset-0 flex flex-col z-10">
          <PDFMainArea toggles={featureToggles} scrollToBox={scrollToBox} />
        </div>
        <div className="topbar-overlay fixed top-0 left-0 right-0 z-30">
          <TopBar toggles={featureToggles} setToggles={setFeatureToggles} />
        </div>
        <div className="featuresbar-overlay fixed top-0 left-0 right-0 z-30">
          <FeaturesBar toggles={featureToggles} setToggles={setFeatureToggles} />
        </div>
        {featureToggles.thumbnails && (
          <div className="sidebar-overlay left fixed top-28 left-0 bottom-0 w-72 z-20">
            <Sidebar toggles={featureToggles} setToggles={setFeatureToggles} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}
        {featureToggles.rightSidebar && (
          <div className="sidebar-overlay right fixed top-28 right-0 bottom-0 w-80 z-20">
            <RightSidebar toggles={featureToggles} onSkimClick={h => setScrollToBox(h)} onCitationClick={c => setScrollToBox(c)} />
          </div>
        )}
        <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-gray-200 text-xs py-2 px-4 flex items-center justify-between z-40 border-t border-gray-700" style={{pointerEvents: 'auto'}}>
          <span>
            <strong>PDF Demo:</strong> All features are powered exclusively by <code>@davidkric/pdf-components</code>. See the <a href="/INTEGRATION_NEXTJS.md" target="_blank" className="underline text-yellow-300">integration guide</a> for best practices.
          </span>
          <span className="hidden md:inline">No direct use of <code>react-pdf</code>, <code>pdfjs-dist</code>, or manual worker setup anywhere in this app.</span>
        </div>
      </div>
    </ContextProvider>
  );
} 