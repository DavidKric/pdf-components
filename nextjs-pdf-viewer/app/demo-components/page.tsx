'use client';

import React from 'react';
import PDFViewerDemoDoclingComponents from '../PDFViewerDemoDoclingComponents';
import Link from 'next/link';

export default function DemoComponentsPage() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-12 bg-purple-600 text-white flex items-center px-4 z-50 shadow">
        <Link href="/" className="font-bold text-sm hover:text-purple-200 mr-4">
          ← Home
        </Link>
        <span className="font-bold text-sm">Docling Web Components Demo</span>
      </div>
      <div>
        <PDFViewerDemoDoclingComponents />
      </div>
    </>
  );
} 