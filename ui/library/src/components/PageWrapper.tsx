'use client';
import classnames from 'classnames';
import * as React from 'react';
// For React-PDF v9 compatibility
const { Page } = require('react-pdf');

import { DocumentContext } from '../context/DocumentContext';
import { PageRenderContext } from '../context/PageRenderContext';
import { TransformContext } from '../context/TransformContext';
import { UiContext } from '../context/UiContext';
import { getClassNameSuffixFromRenderType, RenderType } from '../utils/reader-utils';
import { generatePageIdFromIndex } from '../utils/scroll';
import { computePageStyle, getPageWidth } from '../utils/style';
import { HighlightOverlay } from './HighlightOverlay';
import { Overlay } from './Overlay';

/**
 * A subset of react-pdf's Page component props exposed by this wrapper
 */
export type PageProps = {
  error?: React.ReactNode | ((props: { error: Error }) => React.ReactNode);
  loading?: React.ReactNode | (() => React.ReactNode);
  noData?: React.ReactNode | (() => React.ReactNode);
  pageIndex: number;
};

export type Props = {
  className?: string;
  loadingContentForBuildingImage?: React.ReactElement;
  children?: React.ReactElement<typeof HighlightOverlay | typeof Overlay>;
  renderType: RenderType;
} & PageProps;

export const PageWrapper: React.FunctionComponent<Props> = ({
  children,
  error,
  loading,
  loadingContentForBuildingImage,
  noData,
  pageIndex,
  renderType,
  ...extraProps
}: Props) => {
  const { rotation, scale } = React.useContext(TransformContext);
  const { pageDimensions, getOutlineTargets, setNumPagesLoaded } =
    React.useContext(DocumentContext);
  const { getObjectURLForPage, isBuildingObjectURLForPage } = React.useContext(PageRenderContext);
  const { isLoading, errorMessage } = React.useContext(UiContext);

  const objectURLForPage = getObjectURLForPage({ pageIndex });
  const isBuildingPageImage = isBuildingObjectURLForPage({ pageIndex });

  // If we don't have valid page size data, show the loading or error states
  if (!pageDimensions?.height || !pageDimensions?.width) {
    if (isLoading && loading) {
      return <>{typeof loading === 'function' ? loading() : loading}</>;
    }
    if (!isLoading && errorMessage && error) {
      const err = new Error(errorMessage);
      return <>{typeof error === 'function' ? error({ error: err }) : error}</>;
    }
    if (!isLoading && !errorMessage && noData) {
      return <>{typeof noData === 'function' ? noData() : noData}</>;
    }
    return null;
  }

  const getPageStyle = React.useCallback(() => {
    const styles: Record<string, unknown> = computePageStyle(pageDimensions, rotation, scale);
    if (objectURLForPage) {
      styles.backgroundImage = `url(${objectURLForPage})`;
    }
    return styles;
  }, [pageDimensions, rotation, scale, objectURLForPage]);

  const getWidth = React.useCallback(() => {
    return getPageWidth(pageDimensions, rotation);
  }, [pageDimensions, rotation]);

  const outlineTargets = getOutlineTargets({
    pageIndex,
    scale,
    rotation,
    pageDimensions,
  });

  const markPageAsLoaded = React.useCallback(({ items, styles }: { items: any; styles: any }) => {
    setNumPagesLoaded(prevNumPagesLoaded => prevNumPagesLoaded + 1);
  }, []);

  // Width needs to be set to prevent the outermost Page div from extending to fit the parent,
  // and mis-aligning the text layer.
  return (
    <div
      id={generatePageIdFromIndex(pageIndex)}
      className={classnames(
        'pdf-reader__page',
        { 'pdf-reader__page--has-page-image': objectURLForPage },
        { 'pdf-reader__page--no-page-image': !objectURLForPage },
        `pdf-reader__page--render-type-${getClassNameSuffixFromRenderType(renderType)}`,
        { 'pdf-reader__is-building-page-image': isBuildingPageImage }
      )}
      data-page-number={pageIndex + 1}
      style={getPageStyle()}
      {...extraProps}>
      {children}
      {isBuildingPageImage && !isLoading && (
        <div
          className={classnames('pdf-reader__page', {
            'pdf-reader__page--is-loading-image': isBuildingPageImage,
          })}>
          {loadingContentForBuildingImage}
        </div>
      )}
      <Page
        width={getWidth()}
        error={error}
        loading={loading}
        noData={noData}
        pageIndex={pageIndex}
        scale={scale}
        rotate={rotation}
        renderAnnotationLayer={true}
        onGetTextSuccess={markPageAsLoaded}
      />
      <div className="pdf-reader__page__outline-targets">
        {outlineTargets.map(({ dest, leftPx, topPx }) => (
          <span
            key={dest}
            className="pdf-reader__page__outline-target"
            data-outline-target-dest={dest}
            data-test-id="pdf-reader__page__outline-target"
            style={{ left: leftPx + 'px', top: topPx + 'px' }}
          />
        ))}
      </div>
    </div>
  );
};
