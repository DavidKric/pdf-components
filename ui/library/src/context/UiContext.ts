import * as React from 'react';

import { Nullable } from '../components/types/utils';
import { logProviderWarning } from '../utils/provider';

export interface IUiContext {
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

export const UiContext = React.createContext<IUiContext>({
  errorMessage: null,
  isLoading: false,
  isShowingHighlightOverlay: false,
  isShowingOutline: false,
  isShowingTextHighlight: false,
  isShowingThumbnail: false,
  setErrorMessage: errorMessage => {
    logProviderWarning(`setErrorMessage(${errorMessage})`, 'UiContext');
  },
  setIsShowingOutline: isShowingOutline => {
    logProviderWarning(`setIsShowingOutline(${isShowingOutline})`, 'UiContext');
  },
  setIsLoading: isLoading => {
    logProviderWarning(`setIsLoading(${isLoading})`, 'UiContext');
  },
  setIsShowingHighlightOverlay: isShowingHighlightOverlay => {
    logProviderWarning(`setIsShowingHighlightOverlay(${isShowingHighlightOverlay})`, 'UiContext');
  },
  setIsShowingTextHighlight: isShowingTextHighlight => {
    logProviderWarning(`setIsShowingTextHighlight(${isShowingTextHighlight})`, 'UiContext');
  },
  setIsShowingThumbnail: isShowingThumbnail => {
    logProviderWarning(`setIsShowingThumbnail(${isShowingThumbnail})`, 'UiContext');
  },
});

export function useUiContextProps(): IUiContext {
  const [errorMessage, setErrorMessage] = React.useState<Nullable<string>>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isShowingHighlightOverlay, setIsShowingHighlightOverlay] = React.useState<boolean>(false);
  const [isShowingOutline, setIsShowingOutline] = React.useState<boolean>(false);
  const [isShowingTextHighlight, setIsShowingTextHighlight] = React.useState<boolean>(false);
  const [isShowingThumbnail, setIsShowingThumbnail] = React.useState<boolean>(false);

  // Memoize setters to prevent infinite re-renders in components that use them as dependencies
  const memoizedSetErrorMessage = React.useCallback((errorMessage: Nullable<string>) => {
    setErrorMessage(errorMessage);
  }, []);

  const memoizedSetIsLoading = React.useCallback((isLoading: boolean) => {
    setIsLoading(isLoading);
  }, []);

  const memoizedSetIsShowingHighlightOverlay = React.useCallback((isShowingHighlightOverlay: boolean) => {
    setIsShowingHighlightOverlay(isShowingHighlightOverlay);
  }, []);

  const memoizedSetIsShowingOutline = React.useCallback((isShowingOutline: boolean) => {
    setIsShowingOutline(isShowingOutline);
  }, []);

  const memoizedSetIsShowingTextHighlight = React.useCallback((isShowingTextHighlight: boolean) => {
    setIsShowingTextHighlight(isShowingTextHighlight);
  }, []);

  const memoizedSetIsShowingThumbnail = React.useCallback((isShowingThumbnail: boolean) => {
    setIsShowingThumbnail(isShowingThumbnail);
  }, []);

  return {
    errorMessage,
    isLoading,
    isShowingHighlightOverlay,
    isShowingOutline,
    isShowingTextHighlight,
    isShowingThumbnail,
    setErrorMessage: memoizedSetErrorMessage,
    setIsLoading: memoizedSetIsLoading,
    setIsShowingHighlightOverlay: memoizedSetIsShowingHighlightOverlay,
    setIsShowingOutline: memoizedSetIsShowingOutline,
    setIsShowingTextHighlight: memoizedSetIsShowingTextHighlight,
    setIsShowingThumbnail: memoizedSetIsShowingThumbnail,
  };
}
