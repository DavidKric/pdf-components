/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow importing PDF files from external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arxiv.org',
        port: '',
        pathname: '/pdf/**',
      },
    ],
  },
  // Based on the StackOverflow solution: https://stackoverflow.com/questions/78121846/how-to-get-pdfjs-dist-working-with-next-js-14
  webpack: (config) => {
    // Handle node-specific modules that might be used by the PDF library
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
    };
    
    // These aliases are required for the PDF components to work
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
  // Fix transpilation issues with PDF.js
  transpilePackages: ["react-pdf", "pdfjs-dist"],
};

export default nextConfig; 