import { defineManifest } from '@crxjs/vite-plugin';
import { spawnSync } from 'child_process';

const buildHashCmd = spawnSync(
  'git',
  'describe --always --dirty --tags'.split(' '),
);
const hash = buildHashCmd.stdout.toString().trim();

const manifest = defineManifest({
  name: 'Tab Counter',
  description: `Keeps count of your open tabs and windows. (${hash})`,
  manifest_version: 3,
  version_name: hash,
  version: '1.0.0',
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
});

export default manifest;
