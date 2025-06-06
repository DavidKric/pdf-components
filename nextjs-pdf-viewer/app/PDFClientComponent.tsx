'use client';

import React from 'react';
import {
  ContextProvider,
} from '@davidkric/pdf-components';
import '@davidkric/pdf-components/dist/style.css';
import PDFDemo from './PDFDemo';
// All PDF features must be accessed via @davidkric/pdf-components only.
// Do NOT import or use react-pdf, pdfjs-dist, or pdf.js directly in this app.

export default function PDFClientComponent() {
  return (
    <ContextProvider>
      <PDFDemo />
    </ContextProvider>
  );
} 