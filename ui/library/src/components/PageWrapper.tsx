'use client';
import classnames from 'classnames';
import * as React from 'react';
import { Page } from 'react-pdf';

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
  error?: React.ReactNode | (() => React.ReactNode);
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
  const { isLoading } = React.useContext(UiContext);

  const objectURLForPage = getObjectURLForPage({ pageIndex });
  const isBuildingPageImage = isBuildingObjectURLForPage({ pageIndex });

  // All hooks must be called before any conditional returns
  const getPageStyle = React.useCallback(() => {
    if (!pageDimensions) return {};
    const styles: Record<string, unknown> = computePageStyle(pageDimensions, rotation, scale);
    if (objectURLForPage) {
      styles.backgroundImage = `url(${objectURLForPage})`;
    }
    return styles;
  }, [pageDimensions, rotation, scale, objectURLForPage]);

  const getWidth = React.useCallback(() => {
    if (!pageDimensions) return 0;
    return getPageWidth(pageDimensions, rotation);
  }, [pageDimensions, rotation]);

  // Calculate the corrected scale for React-PDF to match Semantic Reader's behavior
  // The scale from TransformContext represents user zoom (1.0 = 100%)
  // We need to adjust for the fact that our computePageDimensions already applies devicePixelRatio
  // So we neutralize React-PDF's devicePixelRatio to prevent double scaling
  const getReactPdfScale = React.useCallback(() => {
    // Use scale=1 as base since our pageDimensions already account for proper DPI
    // This ensures that 100% user zoom displays at the intended size
    return scale;
  }, [scale]);

  const markPageAsLoaded = React.useCallback(() => {
    setNumPagesLoaded(prevNumPagesLoaded => prevNumPagesLoaded + 1);
  }, []);

  // Don't display until we have page size data
  // TODO: Handle this nicer so we display either the loading or error treatment
  if (!pageDimensions) {
    return null;
  }

  const outlineTargets = getOutlineTargets({
    pageIndex,
    scale,
    rotation,
    pageDimensions,
  });

  // Width needs to be set to prevent the outermost Page div from extending to fit the parent,
  // and mis-aligning the text layer.
  // TODO: Can we CSS this to auto-shrink?
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
        scale={getReactPdfScale()}
        rotate={rotation}
        devicePixelRatio={1}
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
