import { crx } from '@crxjs/vite-plugin';
import zip from 'vite-plugin-zip-pack';
import manifest from './src/manifest';
import pkg from './package.json';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { BUILD_COMMIT } from './global';
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/popup/index.html'),
        sidePanel: resolve(__dirname, 'src/pages/sidePanel/index.html'),
      },
    },
  },

  define: {
    'process.env.BUILD_COMMIT': JSON.stringify(BUILD_COMMIT),
  },

  plugins: [
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'tests'],
      extension: ['.js', '.ts', '.tsx'],
      checkProd: true,
      requireEnv: false,
    }),
    react(),
    crx({ manifest }),
    isProduction &&
      zip({
        outDir: 'releases',
        outFileName: `${pkg.name}-${pkg.version}.zip`,
      }),
  ],
});
