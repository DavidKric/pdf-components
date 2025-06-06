'use client';
import * as React from 'react';
import { DocumentWrapper } from '../components/DocumentWrapper';
import { PageWrapper } from '../components/PageWrapper';
import { ContextProvider } from '../context/ContextProvider';
import { RENDER_TYPE } from '../utils/reader-utils';

const PDF_URL = 'https://arxiv.org/pdf/2404.16130';

export default function MinimalPdfTest() {
  // Only render the first page for minimal demo
  return (
    <ContextProvider>
      <DocumentWrapper file={PDF_URL} renderType={RENDER_TYPE.SINGLE_CANVAS}>
        <PageWrapper pageIndex={0} renderType={RENDER_TYPE.SINGLE_CANVAS} />
      </DocumentWrapper>
    </ContextProvider>
  );
} 