'use client';

import React from 'react';
import PDFViewerDemoWithDocling from '../PDFViewerDemoWithDocling';
import Link from 'next/link';

export default function DemoDoclingPage() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-12 bg-green-600 text-white flex items-center px-4 z-50 shadow">
        <Link href="/" className="font-bold text-sm hover:text-green-200 mr-4">
          ← Home
        </Link>
        <span className="font-bold text-sm">Docling Integration Demo</span>
      </div>
      <div>
        <PDFViewerDemoWithDocling />
      </div>
    </>
  );
} 