import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-12">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            PDF Viewer Demos
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Explore different implementations of PDF viewing with interactive features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Demo 1: Basic PDF Viewer */}
          <Link href="/demo-basic" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Basic PDF Viewer</h3>
              <p className="text-gray-600 text-sm">
                Clean and simple PDF viewer with basic navigation and controls.
              </p>
              <div className="mt-4 text-blue-600 font-medium group-hover:text-blue-800">
                View Demo →
              </div>
            </div>
          </Link>

          {/* Demo 2: Docling Integration */}
          <Link href="/demo-docling" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Docling Integration</h3>
              <p className="text-gray-600 text-sm">
                Advanced PDF viewer with Docling analysis, overlays, and interactive features.
              </p>
              <div className="mt-4 text-green-600 font-medium group-hover:text-green-800">
                View Demo →
              </div>
            </div>
          </Link>

          {/* Demo 3: Docling Components */}
          <Link href="/demo-components" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Docling Web Components</h3>
              <p className="text-gray-600 text-sm">
                PDF viewer using native Docling web components with custom overlays.
              </p>
              <div className="mt-4 text-purple-600 font-medium group-hover:text-purple-800">
                View Demo →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Each demo showcases different approaches to PDF viewing and document analysis.
          </p>
        </div>
      </div>
    </main>
  );
}
