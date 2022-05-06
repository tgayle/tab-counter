import { chromeExtension } from '@crxjs/vite-plugin';
import zip from 'rollup-plugin-zip';
import manifest from './src/manifest';
import react from '@vitejs/plugin-react';
const isProduction = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    react(),
    chromeExtension({ manifest, contentScripts: { preambleCode: false } }),
    isProduction && zip({ dir: 'releases' }),
  ],
};
