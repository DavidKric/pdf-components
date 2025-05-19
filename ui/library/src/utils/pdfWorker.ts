import { pdfjs } from 'react-pdf';
import { debugLog } from './debug';

// Set PDFjs worker source or else PDF will not load when this library is imported as a package.
export function initPdfWorker(): void {
  // Log the current PDF.js version for debugging
  debugLog(`Initializing PDF.js worker (PDF.js version: ${pdfjs.version})`);
  
  // react-pdf v9 is hardcoding to version 2.16.105 internally
  // We need to handle this specific version explicitly
  if (pdfjs.version === '2.16.105') {
    debugLog('Detected version 2.16.105, using local worker file');
    // Use the local worker file we downloaded to the public directory
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    pdfjs.GlobalWorkerOptions.workerSrc = `${currentUrl}/pdf.worker.min.js`;
    debugLog(`Worker URL set to: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
    return;
  }
  
  // For other versions, determine the correct file extension
  const majorVersion = parseInt(pdfjs.version.split('.')[0], 10);
  const fileExtension = majorVersion >= 3 ? '.min.mjs' : '.min.js';
  debugLog(`Detected PDF.js major version ${majorVersion}, using ${fileExtension} extension`);
  
  try {
    // Use unpkg - the recommended CDN by react-pdf documentation
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker${fileExtension}`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    debugLog(`PDF.js worker initialized from unpkg: ${workerUrl}`);
  } catch (error) {
    console.warn('Error setting PDF.js worker to unpkg, trying cdnjs', error);
    try {
      // Fall back to cdnjs
      const cdnjsUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/build/pdf.worker${fileExtension}`;
      pdfjs.GlobalWorkerOptions.workerSrc = cdnjsUrl;
      debugLog(`PDF.js worker initialized from cdnjs: ${cdnjsUrl}`);
    } catch (cdnjsError) {
      console.warn('Error setting PDF.js worker to cdn sources, using bundled version', cdnjsError);
      // Final fallback - let PDF.js use its internal worker (might be a "fake" worker)
    }
  }
}
