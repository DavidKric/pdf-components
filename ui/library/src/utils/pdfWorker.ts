import { pdfjs } from 'react-pdf';

// Set PDFjs worker source for react-pdf v9 (ESM module with .mjs extension)
export function initPdfWorker(): void {
  // Use the correct worker file for react-pdf v9
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}
