# Integration Guide: Using `@davidkric/pdf-components` with Next.js

This guide provides a **schematic, reliable, and up-to-date** process for integrating the `@davidkric/pdf-components` library into a Next.js application, following best practices and including all necessary configurations.

---

## 1. Install Required Packages

Install the PDF component library and its peer dependencies:

```bash
npm install @davidkric/pdf-components react react-dom react-is next
```

> **Note:**  
> - `@davidkric/pdf-components` requires `react`, `react-dom`, and `react-is` as peer dependencies.
> - You do **not** need to install or import `react-pdf` or `pdfjs-dist` in your app; the library manages them internally.

---

## 2. Add Library Styles

Import the library's CSS globally to ensure all PDF components are styled correctly.

- **For App Router (recommended):**  
  In `app/layout.tsx` or `app/layout.js`:

  ```tsx
  import '@davidkric/pdf-components/dist/style.css';
  import './globals.css'; // your own global styles
  ```

- **For Pages Router:**  
  In `pages/_app.tsx` or `pages/_app.js`:

  ```tsx
  import '@davidkric/pdf-components/dist/style.css';
  import '../styles/globals.css'; // your own global styles
  ```

---

## 3. Configure Next.js for PDF.js Compatibility

Add the following to your `next.config.mjs` (or `next.config.js`) to ensure PDF.js works in the browser and to avoid server-side module issues:

```js
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
    };
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  transpilePackages: ["react-pdf", "pdfjs-dist"], // Ensures compatibility with Next.js transpilation
};

export default nextConfig;
```

---

## 4. Provide the PDF.js Worker

**Required for correct PDF rendering:**

- Copy `pdf.worker.min.js` from `node_modules/pdfjs-dist/build/` into your app's `public/` directory.
- The file should be available at `/public/pdf.worker.min.js` so it is served at `/pdf.worker.min.js`.

> The library's `initPdfWorker` utility will automatically use this file when needed.

---

## 5. Use the PDF Components in Your App

**Example (App Router):**

```tsx
'use client';

import React, { useContext } from 'react';
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  RENDER_TYPE,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';

const PDF_URL = '/sample.pdf'; // or any public URL

function PDFViewer() {
  const { numPages } = useContext(DocumentContext);

  return (
    <DocumentWrapper file={PDF_URL}>
      {Array.from({ length: numPages ?? 0 }).map((_, idx) => (
        <PageWrapper
          key={idx}
          pageIndex={idx}
          renderType={RENDER_TYPE.MULTI_CANVAS}
        />
      ))}
    </DocumentWrapper>
  );
}

export default function PDFClientComponent() {
  return (
    <ContextProvider>
      <PDFViewer />
    </ContextProvider>
  );
}
```

---

## 6. Best Practices & Notes

- **Do NOT import or use `react-pdf`, `pdfjs-dist`, or `pdf.js` directly in your app.**  
  All PDF features must be accessed via `@davidkric/pdf-components` only.
- **Static Assets:**  
  Place any PDF files you want to serve in the `public/` directory or use remote URLs.
- **Styling:**  
  You may further customize styles by overriding the library's CSS in your own global styles.
- **Fonts:**  
  If you use custom fonts (e.g., Geist), import them in your layout or global CSS as needed.

---

## 7. Troubleshooting

- **PDFs not rendering?**  
  Ensure `pdf.worker.min.js` is present in `/public/`.
- **Build errors about Node modules?**  
  Double-check the `webpack` and `transpilePackages` settings in your Next.js config.
- **CORS issues with remote PDFs?**  
  Prefer serving PDFs from your own domain or ensure the remote server allows cross-origin requests.

---

## 8. Advanced Usage

- The library exports additional components such as `Overlay`, `HighlightOverlay`, `ThumbnailList`, `Outline`, and more for advanced PDF interactions.
- See the library's TypeScript types for all available props and context values.

---

## 9. Example Directory Structure

```
my-nextjs-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── PDFClientComponent.tsx
├── public/
│   ├── pdf.worker.min.js
│   └── sample.pdf
├── next.config.mjs
├── package.json
└── ...
```

---

**You are now ready to use `@davidkric/pdf-components` in your Next.js application with best practices and robust configuration!** 