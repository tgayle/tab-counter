import { defineManifest } from '@crxjs/vite-plugin';
import { spawnSync } from 'child_process';
import { version } from '../package.json';

const buildHashCmd = spawnSync(
  'git',
  'describe --always --dirty --tags'.split(' '),
);
const hash = buildHashCmd.stdout.toString().trim();

const devMode = process.env.NODE_ENV === 'development';

const manifest = defineManifest({
  name: `Tab Counter${devMode ? ' (Dev)' : ''}`,
  description: `Keeps count of your open tabs and windows`,
  manifest_version: 3,
  version_name: hash,
  version: version,
  permissions: ['tabs', 'storage', 'contextMenus'],
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Alt+T',
      },
    },
  },
  icons: !devMode // Hide icon in dev mode for distinction.
    ? {
        16: 'icons/16.png',
        48: 'icons/48.png',
        128: 'icons/128.png',
      }
    : undefined,
});

export default manifest;
