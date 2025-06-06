# Best Practice Integration: `@davidkric/pdf-components` in Next.js

This guide provides a **step-by-step, explicit checklist** for integrating `@davidkric/pdf-components` as a library in a Next.js project. Each step includes file references, code snippets, and explanations. **No ambiguity—just copy, paste, and verify!**

---

## 1. Install the Library as a Dependency

**File:** `package.json`

```json
"dependencies": {
  "@davidkric/pdf-components": "file:../ui/library/davidkric-pdf-components-v0.0.2.tgz",
  // ...other dependencies
}
```

- The library is installed as a local tarball. You can also use an npm version if available.

---

## 2. Do NOT Import or Use `react-pdf`, `pdfjs-dist`, or Manual PDF.js Workers Directly

**File:** `app/PDFClientComponent.tsx`

```tsx
// All PDF features must be accessed via @davidkric/pdf-components only.
// Do NOT import or use react-pdf, pdfjs-dist, or pdf.js directly in this app.
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  RENDER_TYPE,
} from '@davidkric/pdf-components';
```

- All PDF logic is handled by the library.
- No direct imports from `react-pdf`, `pdfjs-dist`, or `pdf.js` anywhere in the codebase.

---

## 3. Import the Library's CSS

**Files:** `app/PDFClientComponent.tsx`, `app/PDFDemo.tsx`

```tsx
import '@davidkric/pdf-components/dist/style.css';
```

**Example:**
```tsx
import {
  ContextProvider,
  DocumentWrapper,
  PageWrapper,
  DocumentContext,
  RENDER_TYPE,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';
```

- This ensures all required styles for the PDF components are loaded.

---

## 4. Wrap Your PDF Logic in the Provided ContextProvider

**File:** `app/PDFClientComponent.tsx`

```tsx
export default function PDFClientComponent() {
  return (
    <ContextProvider>
      <PDFDemo />
    </ContextProvider>
  );
}
```

- The `ContextProvider` from the library must wrap any components using PDF features.

---

## 5. Use Only the Exported Components and Context from the Library

**File:** `app/PDFDemo.tsx`

```tsx
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
```

**Example Usage:**
```tsx
<DocumentWrapper file={PDF_URL}>
  {Array.from({ length: numPages ?? 0 }).map((_, idx) => (
    <PageWrapper key={idx} pageIndex={idx} renderType={RENDER_TYPE.MULTI_CANVAS} />
  ))}
</DocumentWrapper>
```

- All PDF rendering and features are handled by the library's components.

---

## 6. Configure Webpack for Node Module Fallbacks and Aliases

**File:** `next.config.mjs`

```js
const nextConfig = {
  // ...
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
  transpilePackages: ["react-pdf", "pdfjs-dist"],
};
```

- Prevents server-only modules from being bundled for the client.
- Ensures compatibility with the PDF library and Next.js.

---

## 7. Import the Library's CSS in Your Global Styles (Optional)

**File:** `app/globals.css`

```css
@import url('@davidkric/pdf-components/dist/style.css');
```

- This is optional if you already import the CSS in your main component files.

---

## 8. Example: Main Page Integration

**File:** `app/page.tsx`

```tsx
import PDFClientComponent from './PDFClientComponent';

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="container mx-auto">
        {/* Client component that handles the PDF viewer */}
        <PDFClientComponent />
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            This example demonstrates how to integrate a local pdf-components library with Next.js App Router, following best practices and the official documentation.
          </p>
        </div>
      </div>
    </main>
  );
}
```

---

## 9. No Direct Use of `react-pdf` or `pdfjs-dist` Anywhere

- **Search your codebase** to ensure there are no imports like:
  ```tsx
  import { Document, Page } from 'react-pdf';
  import * as pdfjsLib from 'pdfjs-dist';
  ```
- All PDF logic must go through `@davidkric/pdf-components` only.

---

## 10. Reference: Advanced Features Example

**File:** `app/PDFDemo.tsx`

- Demonstrates toggling features like thumbnails, outline, overlays, highlights, citation popovers, skimming, etc., using only the library's API.

---

## 11. Summary

- **Install** the library as a dependency.
- **Do not** use `react-pdf` or `pdfjs-dist` directly.
- **Import** the library's CSS.
- **Wrap** your PDF logic in `ContextProvider`.
- **Use only** the library's exported components.
- **Configure** Webpack for compatibility.
- **Keep all PDF logic modular and toggleable** for development and demonstration.

---

**You are now following the best practices for integrating `@davidkric/pdf-components` in Next.js!** 