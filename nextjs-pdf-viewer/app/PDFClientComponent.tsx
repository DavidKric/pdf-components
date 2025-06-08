'use client';

import React from 'react';
import '@davidkric/pdf-components/dist/style.css';
import PDFViewerDemoWithDocling from './PDFViewerDemoWithDocling';
// All PDF features must be accessed via @davidkric/pdf-components only.
// Do NOT import or use react-pdf, pdfjs-dist, or pdf.js directly in this app.

export default function PDFClientComponent() {
  return (
    <PDFViewerDemoWithDocling />
  );
} 