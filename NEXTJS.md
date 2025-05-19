# Using pdf-components with Next.js

This guide shows how to set up the `@allenai/pdf-components` library in a Next.js application.

## 1. Install the package

```bash
npm install @allenai/pdf-components
```

## 2. Import the styles

Add the library's CSS in your `pages/_app.tsx` (or `_app.js`). This makes the styles available globally.

```tsx
// pages/_app.tsx
import '@allenai/pdf-components/dist/pdf-components.css';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

## 3. Provide the PDF.js worker

Copy `pdf.worker.min.js` from `node_modules/pdfjs-dist/build/` into your project's `public/` directory so it is served at `/pdf.worker.min.js`. The helper `initPdfWorker` will automatically use this file when the underlying `pdf.js` version requires it.

## 4. Render a PDF

Create a page that uses `ContextProvider`, `DocumentWrapper`, `PageWrapper` and other components. `initPdfWorker` should be called before rendering any PDFs.

```tsx
// pages/reader.tsx
import React from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  Overlay,
  DocumentContext,
  initPdfWorker,
  RENDER_TYPE,
} from '@allenai/pdf-components';

initPdfWorker();

export default function ReaderPage() {
  const { numPages } = React.useContext(DocumentContext);
  const file = '/sample.pdf';

  return (
    <ContextProvider>
      <DocumentWrapper file={file} renderType={RENDER_TYPE.SINGLE_CANVAS}>
        {Array.from({ length: numPages }).map((_, i) => (
          <PageWrapper key={i} pageIndex={i} renderType={RENDER_TYPE.SINGLE_CANVAS}>
            <Overlay />
          </PageWrapper>
        ))}
      </DocumentWrapper>
    </ContextProvider>
  );
}
```

This basic setup loads a PDF and renders each page. Additional components like `HighlightOverlay`, `ThumbnailList`, and others can be included inside the `Overlay` or around the page list as needed.

