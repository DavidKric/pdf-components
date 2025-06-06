# PDF Feature Implementation Tasks

This checklist covers all major features demonstrated in the demo app for `davidkric-pdf-components`. For each feature, reference the pdf-component-library Docs MCP for best practices and usage.

---

- [ ] **Core PDF Rendering**
  - Use `ContextProvider`, `DocumentWrapper`, `PageWrapper`, and `DocumentContext` to render PDFs.
  - Reference: Docs MCP - Components, Contexts, DocumentWrapper

- [ ] **Overlay System**
  - Implement the `Overlay` component for interactive layers on each page.
  - Reference: Docs MCP - Overlay, advanced usage

- [ ] **Highlighting Features**
  - Use `HighlightOverlay` and `BoundingBox` to render highlight boxes and text highlights.
  - Reference: Docs MCP - HighlightOverlay, BoundingBox

- [ ] **Citation Popovers**
  - Implement citation popovers using `CitationsDemo`, `CitationPopover`, and `BoundingBox`.
  - Reference: Docs MCP - Citation Popovers, advanced usage

- [ ] **Outline (Table of Contents)**
  - Use the `Outline` component for PDF outlines/TOC.
  - Reference: Docs MCP - Outline

- [ ] **Thumbnails**
  - Implement thumbnail navigation using `ThumbnailList`.
  - Reference: Docs MCP - ThumbnailList

- [ ] **Zoom Controls**
  - Use `ZoomInButton`, `ZoomOutButton`, and `TransformContext` for zoom functionality.
  - Reference: Docs MCP - TransformContext, Zoom Buttons

- [ ] **Page Number Control**
  - Implement page navigation with `PageNumberControl`.
  - Reference: Docs MCP - PageNumberControl

- [ ] **Scroll-to-Element**
  - Use `scrollToId` utility and `BoundingBox` for scroll-to-feature.
  - Reference: Docs MCP - Scroll logic, ScrollContext

- [ ] **Note Taking (Hypothesis Integration)**
  - Integrate note-taking using a component like `NoteTakingDemo`.
  - Reference: Docs MCP - Note taking, Hypothesis.io integration

- [ ] **Download Button**
  - Add a `DownloadButton` to allow PDF download.
  - Reference: Docs MCP - DownloadButton

- [ ] **UI State Management**
  - Use `UiContext` and custom context for UI state (overlays, drawers, etc.).
  - Reference: Docs MCP - UiContext, ContextProvider

---

**For each task, consult the pdf-component-library Docs MCP for the most accurate and up-to-date usage patterns!** 