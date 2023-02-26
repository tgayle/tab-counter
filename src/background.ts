import browser from 'webextension-polyfill';
import { TabGrouper } from './action/grouping/TabGrouper';
import { setupBadgeCount } from './badge';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab } from './tabutil';

enum InstallReason {
  INSTALL = 'install',
  UPDATE = 'update',
}

async function main() {
  browser.tabs.onUpdated.addListener(async (_, __, tab) => {
    updateTabContextMenu(tab);
  });

  browser.tabs.onActivated.addListener(async (info) =>
    browser.tabs.get(info.tabId).then(updateTabContextMenu),
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

  getCurrentTab().then((tab) => tab && updateTabContextMenu(tab));
  // setupDupeLinkMenu();
  setupBadgeCount();
}

main();
