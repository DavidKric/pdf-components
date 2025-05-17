declare module 'react-pdf';

export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<any>;
  getOutline(): Promise<any>;
  getDestination(dest: string): Promise<any>;
  getPageIndex(ref: any): Promise<number>;
  // Add more methods as needed
}

declare module 'react-pdf' {
  export const pdfjs: any;
  // ...other exports
} 