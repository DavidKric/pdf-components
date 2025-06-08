'use client';

import React from 'react';
import PDFDemo from '../PDFDemo';
import Link from 'next/link';

export default function DemoBasicPage() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-12 bg-blue-600 text-white flex items-center px-4 z-50 shadow">
        <Link href="/" className="font-bold text-sm hover:text-blue-200 mr-4">
          ← Home
        </Link>
        <span className="font-bold text-sm">Basic PDF Viewer Demo</span>
      </div>
      <div style={{ paddingTop: '48px' }}>
        <PDFDemo />
      </div>
    </>
  );
} 