import browser from 'webextension-polyfill';
import { TabGrouper } from './action/grouping/TabGrouper';
import { setupBadgeCount } from './badge';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab, Tab } from './tabutil';
import Features from './Features';
import { configureTabArchiving } from './features/archives';

enum InstallReason {
  INSTALL = 'install',
  UPDATE = 'update',
}

async function main() {
  browser.tabs.onUpdated.addListener(async (_, __, tab) => {
    updateContextMenu(tab);
  });

  browser.tabs.onActivated.addListener(async (info) =>
    browser.tabs.get(info.tabId).then(updateContextMenu),
  );

  browser.runtime.onInstalled.addListener(async (details) => {
    if (
      details.reason === InstallReason.INSTALL ||
      (details.reason === InstallReason.UPDATE &&
        details.previousVersion === '1.0.1')
    ) {
      console.log('Upgrade or new install! Registering rules for user...');
      new TabGrouper().restoreDefaultRules();
    }
  });

  if (Features.TAB_ARCHIVING) {
    configureTabArchiving();
  }

  getCurrentTab().then((tab) => tab && updateContextMenu(tab));
  setupBadgeCount();
}

let pendingUpdate: NodeJS.Timeout | null = null;
function updateContextMenu(tab: Tab) {
  if (pendingUpdate) {
    clearTimeout(pendingUpdate);
    pendingUpdate = null;
  }

  pendingUpdate = setTimeout(() => {
    updateTabContextMenu(tab);
    pendingUpdate = null;
  }, 200);
}

main();
