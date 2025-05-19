import * as React$1 from 'react';
import { PDFDocumentProxy } from 'react-pdf';

type Props$g = {
    className?: string;
    children?: React$1.ReactNode;
    onZoom?: (scale: number) => void;
};
declare const ZoomInButton: React$1.FunctionComponent<Props$g>;

type Props$f = {
    className?: string;
};
declare const PageNumberControl: React$1.FunctionComponent<Props$f>;

type Dimensions = {
    height: number;
    width: number;
};
type Origin = {
    top: number;
    left: number;
};
type Size = Dimensions & Origin;
type BoundingBox$1 = {
    page: number;
} & Size;
type RawBoundingBox = BoundingBox$1;
declare function scaleRawBoundingBox(boundingBoxRaw: RawBoundingBox, pageHeight: number, pageWidth: number): BoundingBox$1;

type Props$e = {
    className?: string;
    underlineClassName?: string;
    id?: string;
    isHighlighted?: boolean;
    onClick?: () => void;
    voiceOverLabel?: string;
} & BoundingBox$1;
declare const BoundingBox: React$1.FunctionComponent<Props$e>;

declare const RENDER_TYPE: {
    readonly MULTI_CANVAS: "multi-canvas";
    readonly SINGLE_CANVAS: "single-canvas";
};
type RenderType = typeof RENDER_TYPE[keyof typeof RENDER_TYPE];

type Props$d = {
    children?: React$1.ReactNode;
    className?: string;
    file?: string | Uint8Array | {
        data: Uint8Array;
    } | null;
    inputRef?: React$1.RefObject<HTMLDivElement>;
    options?: any;
    renderType?: typeof RENDER_TYPE[keyof typeof RENDER_TYPE];
    error?: React$1.ReactNode | ((error: Error) => React$1.ReactNode);
    loading?: React$1.ReactNode | (() => React$1.ReactNode);
};
declare const DocumentWrapper: React$1.FunctionComponent<Props$d>;

type Props$c = {
    className?: string;
    children?: React$1.ReactNode;
    pdfUrl: string;
};
/**
 * HTML anchor tag allows you to download a file from the same origin.
 * This is a workaround to download a file served from a different origin
 */
declare const DownloadButton: React$1.FunctionComponent<Props$c>;

type Props$b = {
    children?: React$1.ReactElement<Props$e> | Array<React$1.ReactElement<Props$e>>;
    pageIndex: number;
};
declare const HighlightOverlay: React$1.FunctionComponent<Props$b>;

declare const POSITION: {
    readonly LEFT: "LEFT";
    readonly RIGHT: "RIGHT";
};
type PositionType = typeof POSITION[keyof typeof POSITION];
type Props$a = {
    className?: string;
    flagWidth?: number;
    label?: string;
    originTop?: number;
    position?: PositionType;
    tailLength?: number;
    tailWidgth?: number;
};
declare const ArrowFlagBase: React$1.FunctionComponent<Props$a>;

type Props$9 = {
    children?: React$1.ReactNode;
    className?: string;
    headerPosition?: PositionType;
};
declare const IconFlag: React$1.FunctionComponent<Props$9>;

type Props$8 = {
    boundingBoxes: Array<BoundingBox$1>;
    className?: string;
    label?: string;
};
declare const ArrowFlag: React$1.FunctionComponent<Props$8>;

declare const Outline: React$1.FunctionComponent;

declare enum PageRotation {
    Rotate0 = 0,
    Rotate90 = 90,
    Rotate180 = 180,
    Rotate270 = 270
}
declare function rotateClockwise(rotation: PageRotation): PageRotation;
declare function rotateCounterClockwise(rotation: PageRotation): PageRotation;
/**
 * Tests whether the page is rotated 90 degrees clockwise or counterclockwise from zero,
 * e.g. whether the page "is rotated sideways."
 */
declare function isSideways(rotation: PageRotation): boolean;

type Nullable<T> = T | null;

type NodeDestination = Nullable<string> | any[];
type OutlineNode = {
    title: string;
    bold: boolean;
    italic: boolean;
    color: Uint8ClampedArray;
    dest: NodeDestination;
    url: Nullable<string>;
    unsafeUrl: string | undefined;
    newWindow: boolean | undefined;
    count: number | undefined;
    items: any[];
};
type OutlinePosition = {
    pageNumber: number;
    dest: string;
    leftPoint: number;
    bottomPoint: number;
};
type OutlinePositionsByPageNumberMap = Map<number, OutlinePosition[]>;
type OutlineTarget = {
    dest: string;
    leftPx: number;
    topPx: number;
};
type OutlineTargetArgs = {
    pageNumber?: number;
    pageIndex?: number;
    scale: number;
    rotation: PageRotation;
    pageDimensions: Dimensions;
};

type Props$7 = {
    items?: Array<OutlineNode>;
    onClick?: (dest: NodeDestination) => void;
};
declare const OutlineItem: React$1.FunctionComponent<Props$7>;

type Props$6 = {
    children?: React$1.ReactElement<typeof BoundingBox> | Array<React$1.ReactElement<typeof BoundingBox>>;
};
declare const Overlay: React$1.FunctionComponent<Props$6>;

/**
 * A subset of react-pdf's Page component props exposed by this wrapper
 */
type PageProps = {
    error?: React$1.ReactNode | ((props: {
        error: Error;
    }) => React$1.ReactNode);
    loading?: React$1.ReactNode | (() => React$1.ReactNode);
    noData?: React$1.ReactNode | (() => React$1.ReactNode);
    pageIndex: number;
};
type Props$5 = {
    className?: string;
    loadingContentForBuildingImage?: React$1.ReactElement;
    children?: React$1.ReactElement<typeof HighlightOverlay | typeof Overlay>;
    renderType: RenderType;
} & PageProps;
declare const PageWrapper: React$1.FunctionComponent<Props$5>;

type Props$4 = {
    className?: string;
    children?: React$1.ReactNode;
};
/**
 * HTML anchor tag allows you to download a file from the same origin.
 * This is a workaround to download a file served from a different origin
 */
declare const PrintButton: React$1.FunctionComponent<Props$4>;

type Props$3 = {
    minWidthPx?: number;
    maxWidthPx?: number;
    className?: string;
    children?: React$1.ReactNode;
    header?: string | React$1.ReactElement;
    content?: string | React$1.ReactElement;
    footer?: string | React$1.ReactElement;
    isVisible?: boolean;
    dragHandlePosition?: string;
    closeButton?: boolean | React$1.ReactElement;
    onClose?: () => void;
};
declare const SidePanel: React$1.FunctionComponent<Props$3>;

type Props$2 = {
    pageNumber: number;
};
declare const Thumbnail: React$1.FunctionComponent<Props$2>;

type Props$1 = any;
declare const ThumbnailList: React$1.FunctionComponent<Props$1>;

type PageReference = {
    num: number;
    gen: number;
};
type PageProperties = {
    width: number;
    height: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
};
/**
 * pageNumber: number starts from 1
 * pageIndex: number starts from 0
 */
type PageNumber = {
    pageNumber?: number;
    pageIndex?: number;
};

declare const ZoomOutButton: React$1.FunctionComponent;

type Props = {
    children?: React$1.ReactElement | Array<React$1.ReactElement>;
};
declare const ContextProvider: React$1.FunctionComponent<Props>;

interface IDocumentContext {
    numPages: number;
    numPagesLoaded: number;
    outline: Nullable<Array<OutlineNode>>;
    outlinePositions: Nullable<OutlinePositionsByPageNumberMap>;
    pageDimensions: Dimensions;
    pdfDocProxy?: PDFDocumentProxy;
    getOutlineTargets: (opts: OutlineTargetArgs) => OutlineTarget[];
    setNumPages: (numPages: number) => void;
    setNumPagesLoaded: (numPagesLoaded: number | ((prevNumPagesLoaded: number) => number)) => void;
    setOutline: (outline: Nullable<Array<OutlineNode>>) => void;
    setOutlinePositions: (outlinePositions: Nullable<OutlinePositionsByPageNumberMap>) => void;
    setPageDimensions: (pageDimensions: Dimensions) => void;
    setPdfDocProxy: (pdfDocProxy: PDFDocumentProxy) => void;
}
declare const DocumentContext: React$1.Context<IDocumentContext>;

type VisibleEntryDetailType = {
    ratio: number;
    timestamp: number;
};

type RenderState = {
    promise: Promise<string>;
    objectURL: Nullable<string>;
};
type PageNumberToRenderStateMap = Map<number, RenderState>;
interface IPageRenderContext {
    pageRenderStates: PageNumberToRenderStateMap;
    getObjectURLForPage: (pageNumber: PageNumber) => Nullable<string>;
    isBuildingObjectURLForPage: (pageNumber: PageNumber) => boolean;
    isFinishedBuildingAllPagesObjectURLs: () => boolean;
    buildObjectURLForPage: (pageNumber: PageNumber) => Promise<string>;
}
declare const PageRenderContext: React$1.Context<IPageRenderContext>;

declare enum ScrollDirection {
    UP = "UP",
    DOWN = "DOWN"
}

interface IScrollContext {
    isOutlineTargetVisible: (dest: NodeDestination) => boolean;
    isPageVisible: (pageNumber: PageNumber) => boolean;
    scrollDirection: Nullable<ScrollDirection>;
    visibleOutlineTargets: Map<NodeDestination, VisibleEntryDetailType>;
    visiblePageRatios: Map<number, VisibleEntryDetailType>;
    resetScrollObservers: () => void;
    scrollRoot: Nullable<HTMLElement>;
    setScrollRoot: (root: Nullable<HTMLElement>) => void;
    scrollToOutlineTarget: (dest: NodeDestination) => void;
    setScrollThreshold: (scrollThreshold: Nullable<number>) => void;
    scrollToPage: (pageNumber: PageNumber) => void;
    updateScrollPosition: (zoomMultiplier: number) => void;
    setIsOutlineClicked: (isOutlineGetClicked: boolean) => void;
    scrollThresholdReachedInDirection: Nullable<ScrollDirection>;
    isAtTop: Nullable<boolean>;
    isOutlineClicked: Nullable<boolean>;
    pagesScrolledIntoView: Map<number, VisibleEntryDetailType>;
    setPageScrolledIntoViewThreshold: (threshold: number) => void;
}
declare const ScrollContext: React$1.Context<IScrollContext>;

declare const DEFAULT_ZOOM_SCALE = 1;
interface ITransformContext {
    pixelRatio: number;
    rotation: PageRotation;
    scale: number;
    zoomIncrementValue: number;
    setPixelRatio: (devicePixelRatio: number) => void;
    setRotation: (rotation: PageRotation) => void;
    setScale: (scale: number) => void;
    setZoomIncrementValue: (value: number) => void;
}
declare const TransformContext: React$1.Context<ITransformContext>;

interface IUiContext {
    errorMessage: Nullable<string>;
    isLoading: boolean;
    isShowingHighlightOverlay: boolean;
    isShowingOutline: boolean;
    isShowingTextHighlight: boolean;
    isShowingThumbnail: boolean;
    setErrorMessage: (errorMessage: Nullable<string>) => void;
    setIsLoading: (isLoading: boolean) => void;
    setIsShowingHighlightOverlay: (isShowingHighlightOverlay: boolean) => void;
    setIsShowingOutline: (isShowingOutline: boolean) => void;
    setIsShowingTextHighlight: (isShowingTextHighlight: boolean) => void;
    setIsShowingThumbnail: (isShowingThumbnail: boolean) => void;
}
declare const UiContext: React$1.Context<IUiContext>;

declare const PercentFormatter: Intl.NumberFormat;

declare function initPdfWorker(): void;

declare function generatePageIdFromIndex(pageIndex: number | string): string;
declare function scrollToId(id: string): void;
declare function scrollToPdfPageIndex(pageIndex: number | string): void;

declare function computeBoundingBoxStyle(boundingBoxSize: Size, pageDimensions: Dimensions, rotation: PageRotation, scale: number): Size;
declare function computePageStyle(pageDimensions: Dimensions, rotation: PageRotation, scale: number): Size;
declare function getPageHeight(pageDimensions: Dimensions, rotation: PageRotation): number;
declare function getPageWidth(pageDimensions: Dimensions, rotation: PageRotation): number;

/**
 * Main entry point for the PDF Component Library.
 * Exports all core components, contexts, utilities, and types.
 * @packageVersion 0.0.1
 */
declare const VERSION = "0.0.1";
declare const CONSTANTS: {
    readonly DEFAULT_ZOOM_SCALE: 1;
    readonly RENDER_TYPE: {
        readonly MULTI_CANVAS: "multi-canvas";
        readonly SINGLE_CANVAS: "single-canvas";
    };
    readonly POSITION: {
        readonly LEFT: "LEFT";
        readonly RIGHT: "RIGHT";
    };
};

declare const _default: {
    ArrowFlag: React$1.FunctionComponent<{
        boundingBoxes: Array<BoundingBox$1>;
        className?: string;
        label?: string;
    }>;
    ArrowFlagBase: React$1.FunctionComponent<{
        className?: string;
        flagWidth?: number;
        label?: string;
        originTop?: number;
        position?: PositionType;
        tailLength?: number;
        tailWidgth?: number;
    }>;
    BoundingBox: React$1.FunctionComponent<Props$e>;
    computeBoundingBoxStyle: typeof computeBoundingBoxStyle;
    computePageStyle: typeof computePageStyle;
    ContextProvider: React$1.FunctionComponent<Props>;
    DEFAULT_ZOOM_SCALE: number;
    DocumentContext: React$1.Context<IDocumentContext>;
    DocumentWrapper: React$1.FunctionComponent<Props$d>;
    DownloadButton: React$1.FunctionComponent<Props$c>;
    generatePageIdFromIndex: typeof generatePageIdFromIndex;
    getPageHeight: typeof getPageHeight;
    getPageWidth: typeof getPageWidth;
    HighlightOverlay: React$1.FunctionComponent<Props$b>;
    IconFlag: React$1.FunctionComponent<{
        children?: React.ReactNode;
        className?: string;
        headerPosition?: PositionType;
    }>;
    initPdfWorker: typeof initPdfWorker;
    isSideways: typeof isSideways;
    Outline: React$1.FunctionComponent<{}>;
    OutlineItem: React$1.FunctionComponent<{
        items?: Array<OutlineNode>;
        onClick?: (dest: NodeDestination) => void;
    }>;
    Overlay: React$1.FunctionComponent<Props$6>;
    PageNumberControl: React$1.FunctionComponent<Props$f>;
    PageRenderContext: React$1.Context<IPageRenderContext>;
    PageRotation: typeof PageRotation;
    PageWrapper: React$1.FunctionComponent<Props$5>;
    PercentFormatter: Intl.NumberFormat;
    POSITION: {
        readonly LEFT: "LEFT";
        readonly RIGHT: "RIGHT";
    };
    PrintButton: React$1.FunctionComponent<Props$4>;
    RENDER_TYPE: {
        readonly MULTI_CANVAS: "multi-canvas";
        readonly SINGLE_CANVAS: "single-canvas";
    };
    rotateClockwise: typeof rotateClockwise;
    rotateCounterClockwise: typeof rotateCounterClockwise;
    scaleRawBoundingBox: typeof scaleRawBoundingBox;
    ScrollContext: React$1.Context<IScrollContext>;
    scrollToId: typeof scrollToId;
    scrollToPdfPageIndex: typeof scrollToPdfPageIndex;
    SidePanel: React$1.FunctionComponent<Props$3>;
    Thumbnail: React$1.FunctionComponent<{
        pageNumber: number;
    }>;
    ThumbnailList: React$1.FunctionComponent<any>;
    TransformContext: React$1.Context<ITransformContext>;
    UiContext: React$1.Context<IUiContext>;
    ZoomInButton: React$1.FunctionComponent<Props$g>;
    ZoomOutButton: React$1.FunctionComponent<{}>;
};

export { ArrowFlag, ArrowFlagBase, BoundingBox, type Props$e as BoundingBoxProps, type BoundingBox$1 as BoundingBoxType, CONSTANTS, ContextProvider, type Props as ContextProviderProps, DEFAULT_ZOOM_SCALE, type Dimensions, DocumentContext, DocumentWrapper, type Props$d as DocumentWrapperProps, DownloadButton, type Props$c as DownloadButtonProps, HighlightOverlay, type Props$b as HighlightOverlayProps, type IDocumentContext, type IPageRenderContext, type IScrollContext, type ITransformContext, type IUiContext, IconFlag, type NodeDestination, type Nullable, type Origin, Outline, OutlineItem, type OutlineNode, Overlay, type Props$6 as OverlayProps, POSITION, PageNumberControl, type PageProperties, type PageProps, type PageReference, PageRenderContext, PageRotation, PageWrapper, type Props$5 as PageWrapperProps, PercentFormatter, type PositionType, PrintButton, type Props$4 as PrintButtonProps, RENDER_TYPE, type RawBoundingBox, ScrollContext, SidePanel, type Props$3 as SidePanelProps, type Size, Thumbnail, ThumbnailList, TransformContext, UiContext, VERSION, ZoomInButton, ZoomOutButton, computeBoundingBoxStyle, computePageStyle, _default as default, generatePageIdFromIndex, getPageHeight, getPageWidth, initPdfWorker, isSideways, rotateClockwise, rotateCounterClockwise, scaleRawBoundingBox, scrollToId, scrollToPdfPageIndex };
