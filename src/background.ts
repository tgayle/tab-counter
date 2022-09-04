import { setupBadgeCount } from './badge';
import { setupDupeLinkMenu } from './contextmenu/listDuplicateLinks';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab } from './tabutil';

async function main() {
  chrome.tabs.onUpdated.addListener(async (_, __, tab) => {
    updateTabContextMenu(tab);
  });

  chrome.tabs.onActivated.addListener(async (info) =>
    chrome.tabs.get(info.tabId).then(updateTabContextMenu),
  );

  getCurrentTab().then((tab) => tab && updateTabContextMenu(tab));
  setupDupeLinkMenu();
  setupBadgeCount();
}

main();
