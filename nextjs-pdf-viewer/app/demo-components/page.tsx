'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the docling components demo to avoid SSR issues
const PDFViewerDemoDoclingComponents = dynamic(
  () => import('../PDFViewerDemoDoclingComponents'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading Docling Components...</div>
      </div>
    )
  }
);

export default function DemoComponentsPage() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-12 bg-purple-600 text-white flex items-center px-4 z-50 shadow">
        <Link href="/" className="font-bold text-sm hover:text-purple-200 mr-4">
          ← Home
        </Link>
        <span className="font-bold text-sm">Docling Web Components Demo</span>
      </div>
      <div className="pt-12">
        <PDFViewerDemoDoclingComponents />
      </div>
    </>
  );
} 