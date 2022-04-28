import type { ManifestV3 } from 'rollup-plugin-chrome-extension';
import { spawnSync } from 'child_process';

const buildHashCmd = spawnSync(
  'git',
  'describe --always --dirty --tags'.split(' '),
);
const hash = buildHashCmd.stdout.toString().trim();

const manifest: ManifestV3 = {
  $schema: 'https://json.schemastore.org/chrome-manifest',
  name: 'Tab Counter',
  description: `Keeps count of your open tabs and windows. (${hash})`,
  manifest_version: 3,
  version_name: hash,
  version: '1.0.0',
  permissions: ['tabs', 'storage', 'contextMenus'],
  background: {
    service_worker: 'background.ts',
    type: 'module',
  },
  action: {
    default_popup: 'pages/popup/index.html',
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Alt+T',
      },
    },
  },
};

export default manifest;
