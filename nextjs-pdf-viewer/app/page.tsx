import PDFClientComponent from './PDFClientComponent';

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="container mx-auto">
        
        {/* Client component that handles the PDF viewer */}
        <PDFClientComponent />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            This example demonstrates how to integrate a local pdf-components library with Next.js App Router, following best practices and the official documentation.
          </p>
        </div>
      </div>
    </main>
  );
}
