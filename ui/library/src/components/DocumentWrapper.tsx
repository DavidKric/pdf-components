'use client';
import * as React from 'react';
import { pdfjs } from 'react-pdf';
// For React-PDF v9 compatibility
const { Document } = require('react-pdf');
// import type { PDFDocumentProxy } from 'react-pdf';
type PDFDocumentProxy = any;

import { DocumentContext } from '../context/DocumentContext';
import { ScrollContext } from '../context/ScrollContext';
import { TransformContext } from '../context/TransformContext';
import { UiContext } from '../context/UiContext';
import { getErrorMessage } from '../utils/errorMessage';
import { initPdfWorker } from '../utils/pdfWorker';
import { getRenderMode, RENDER_TYPE } from '../utils/reader-utils';
import { computePageDimensions, IPDFPageProxy } from '../utils/scale';
import { scrollToPosition } from '../utils/scroll';
import { Destination, Ref } from './types/destination';

export type Props = {
  children?: React.ReactNode;
  className?: string;
  file?: string | Uint8Array | { data: Uint8Array } | null;
  inputRef?: React.RefObject<HTMLDivElement>;
  options?: any;
  renderType?: typeof RENDER_TYPE[keyof typeof RENDER_TYPE];
  error?: React.ReactNode | ((error: Error) => React.ReactNode);
  loading?: React.ReactNode | (() => React.ReactNode);
};

// Initialize the PDF worker once when the module is loaded
// This prevents multiple initializations when the component is mounted multiple times
// and ensures it's called before any PDF components are used
initPdfWorker();

export const DocumentWrapper: React.FunctionComponent<Props> = ({
  children,
  className,
  file,
  inputRef,
  options,
  renderType = RENDER_TYPE.MULTI_CANVAS,
  error,
  loading,
  ...extraProps
}: Props) => {
  const { pdfDocProxy, setNumPages, setPageDimensions, setPdfDocProxy, setNumPagesLoaded } =
    React.useContext(DocumentContext);
  const { resetScrollObservers } = React.useContext(ScrollContext);
  const { rotation } = React.useContext(TransformContext);
  const { setErrorMessage, setIsLoading } = React.useContext(UiContext);

  // Track whether the component has been mounted to prevent useEffect from running multiple times
  const hasMountedRef = React.useRef(false);

  function getFirstPage(pdfDoc: PDFDocumentProxy): Promise<IPDFPageProxy> {
    // getPage uses 1-indexed pageNumber, not 0-indexed pageIndex
    return pdfDoc.getPage(1);
  }

  // Only reset scroll observers once on mount to prevent infinite renders
  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      resetScrollObservers();
    }
  }, [resetScrollObservers]);

  const onPdfLoadSuccess = React.useCallback(
    (pdfDoc: PDFDocumentProxy): void => {
      setNumPages(pdfDoc.numPages);
      setNumPagesLoaded(0);
      getFirstPage(pdfDoc)
        .then(page => {
          setPageDimensions(computePageDimensions(page));
          setErrorMessage(null);
        })
        .catch(error => {
          setErrorMessage(getErrorMessage(error));
        })
        .finally(() => {
          setIsLoading(false);
        });

      if (!pdfDocProxy) {
        setPdfDocProxy(pdfDoc);
      }
    },
    [pdfDocProxy, setErrorMessage, setIsLoading, setNumPages, setNumPagesLoaded, setPageDimensions, setPdfDocProxy]
  );

  const onPdfLoadError = React.useCallback(
    (error: unknown): void => {
      setErrorMessage(getErrorMessage(error));
      setIsLoading(false);
    },
    [setErrorMessage, setIsLoading]
  );

  const onItemClicked = React.useCallback(
    (param: Destination): void => {
      if (!pdfDocProxy) {
        return;
      }

      // Scroll to the destination of the item
      pdfDocProxy
        .getDestination(param.dest)
        .then((destArray: any) => {
          if (!destArray) {
            return;
          }

          // destArray is in the format: [ref, params]
          const ref = destArray[0] as Ref;
          pdfDocProxy.getPageIndex(ref).then((pageIndex: number) => {
            // Call scrollToPosition with the appropriate parameters
            scrollToPosition(pageIndex, 0, 0, rotation);
          });
        })
        .catch(() => {
          /* ignore invalid destinations */
        });
    },
    [pdfDocProxy, rotation]
  );

  const renderMode = getRenderMode(renderType);

  return (
    <div className={className} ref={inputRef}>
      <Document
        file={file}
        options={options}
        onLoadSuccess={onPdfLoadSuccess}
        onLoadError={onPdfLoadError}
        onItemClick={onItemClicked}
        renderMode={renderMode}
        error={error}
        loading={loading}
        {...extraProps}>
        {children}
      </Document>
    </div>
  );
};
