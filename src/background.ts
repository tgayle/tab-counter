import { TabGrouper } from './action/grouping/TabGrouper';
import { setupBadgeCount } from './badge';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab } from './tabutil';

const InstallReason = chrome.runtime.OnInstalledReason;

async function main() {
  chrome.tabs.onUpdated.addListener(async (_, __, tab) => {
    updateTabContextMenu(tab);
  });

  chrome.tabs.onActivated.addListener(async (info) =>
    chrome.tabs.get(info.tabId).then(updateTabContextMenu),
  );

  chrome.runtime.onInstalled.addListener(async (details) => {
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
