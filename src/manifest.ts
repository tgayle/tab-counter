import { defineManifest } from '@crxjs/vite-plugin';
import { version } from '../package.json';
import { BUILD_COMMIT } from '../global';
import Features, { inDev } from './Features';

const conditionalFeature = (
  feature: string,
  featureFlag: boolean | undefined,
): string[] => {
  return featureFlag ? [feature] : [];
};

const manifest = defineManifest({
  name: `Tab Counter${inDev ? ' (Dev)' : ''}`,
  description: `Keeps count of your open tabs and windows`,
  manifest_version: 3,
  version_name: `${version} (${BUILD_COMMIT})`,
  version: version,
  permissions: [
    'tabs',
    'storage',
    'contextMenus',
    ...conditionalFeature('tabGroups', Features.TAB_GROUPING),
    'sidePanel',
  ],
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'src/pages/sidePanel/index.html',
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
  icons: !inDev // Hide icon in dev mode for distinction.
    ? {
        16: 'icons/16.png',
        48: 'icons/48.png',
        128: 'icons/128.png',
      }
    : undefined,
});

export default manifest;
