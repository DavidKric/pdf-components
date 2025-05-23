import {
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  RENDER_TYPE,
  ScrollContext,
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

import { DemoHeaderContextProvider } from '../context/DemoHeaderContext';
import { Annotations, generateCitations, PageToAnnotationsMap } from '../types/annotations';
import { RawCitation } from '../types/citations';
import { CitationsDemo } from './CitationsDemo';
import { Header } from './Header';
import { HighlightOverlayDemo } from './HighlightOverlayDemo';
import { NoteTakingDemo } from './NoteTakingDemo';
import { Outline } from './Outline';
import { ScrollToDemo } from './ScrollToDemo';
import { TextHighlightDemo } from './TextHighlightDemo';
import { Thumbnail } from './Thumbnail';

// Define PDF.js options outside of React component
const pdfOptions = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { setScrollRoot } = React.useContext(ScrollContext);
  const [annotations, setAnnotations] = React.useState<PageToAnnotationsMap>(
    new Map<number, Annotations>()
  );
  const [rawCitations, setRawCitations] = React.useState<RawCitation[]>();

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  // PDF sample URL
  // For react-pdf v9, using a local PDF file is more reliable than remote URLs (which can have CORS issues)
  const samplePdfUrl = '/sample.pdf';
  const sampleS2airsUrl =
    'http://s2airs.prod.s2.allenai.org/v1/pdf_data?pdf_sha=9b79eb8d21c8a832daedbfc6d8c31bebe0da3ed5';

  React.useEffect(() => {
    // If data has been loaded then return directly to prevent sending multiple requests
    if (rawCitations) {
      return;
    }

    fetch(sampleS2airsUrl, { referrer: '' })
      .then(response => response.json())
      .then(data => {
        setRawCitations(data[0].citations);
      });
  }, [pageDimensions]);

  React.useEffect(() => {
    setScrollRoot(null);
  }, []);

  // Attaches annotation data to paper
  React.useEffect(() => {
    // Don't execute until paper data and PDF document have loaded
    if (!rawCitations || !pageDimensions.height || !pageDimensions.width) {
      return;
    }

    setAnnotations(generateCitations(rawCitations, pageDimensions));
  }, [rawCitations, pageDimensions]);

  return (
    <BrowserRouter>
      <Route path="/">
        <div className="reader__container">
          <DemoHeaderContextProvider>
            <Header pdfUrl={samplePdfUrl} />
            <DocumentWrapper
              className="reader__main"
              file={samplePdfUrl}
              inputRef={pdfContentRef}
              options={pdfOptions}
              renderType={RENDER_TYPE.SINGLE_CANVAS}
              error={(error) => (
                <div style={{ padding: 20, color: 'red' }}>
                  <h2>Failed to load PDF</h2>
                  <p>{error ? error.message : 'Unknown error occurred'}</p>
                  <p>Check browser console for more details.</p>
                </div>
              )}
              loading={() => (
                <div style={{ padding: 20 }}>
                  <h2>Loading PDF...</h2>
                </div>
              )}>
              <Outline parentRef={pdfContentRef} />
              <Thumbnail parentRef={pdfContentRef} />
              <div className="reader__page-list" ref={pdfScrollableRef}>
                {Array.from({ length: numPages }).map((_, i) => (
                  <PageWrapper key={i} pageIndex={i} renderType={RENDER_TYPE.SINGLE_CANVAS}>
                    <Overlay>
                      <HighlightOverlayDemo pageIndex={i} />
                      <TextHighlightDemo pageIndex={i} />
                      <ScrollToDemo pageIndex={i} />
                      <CitationsDemo
                        annotations={annotations}
                        pageIndex={i}
                        parentRef={pdfScrollableRef}
                      />
                    </Overlay>
                  </PageWrapper>
                ))}
              </div>
            </DocumentWrapper>
            <NoteTakingDemo />
          </DemoHeaderContextProvider>
        </div>
      </Route>
    </BrowserRouter>
  );
};
