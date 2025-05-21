import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  platform: 'browser',
  splitting: false,
  external: ['react', 'react-dom'],
  esbuildPlugins: [
    {
      name: 'node-stub',
      setup(build) {
        const nodeModules = ['fs', 'http', 'https', 'url', 'zlib', 'canvas', 'path', 'crypto'];
        for (const mod of nodeModules) {
          build.onResolve({ filter: new RegExp(`^${mod}$`) }, () => ({
            path: mod,
            namespace: 'node-stub'
          }));
        }
        build.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => ({
          contents: 'export default {}',
          loader: 'js'
        }));
      }
    }
  ]
}); 