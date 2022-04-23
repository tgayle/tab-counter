import { setupDupeLinkMenu } from './contextmenu/listDuplicateLinks';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab, getTabInfo } from './tabutil';

async function updateCount() {
  await chrome.action.setBadgeText({
    text: (await getTabInfo()).text,
  });
}

function main() {
  chrome.tabs.onCreated.addListener(updateCount);
  chrome.tabs.onRemoved.addListener(updateCount);
  chrome.tabs.onUpdated.addListener((_, __, tab) => updateTabContextMenu(tab));
  chrome.tabs.onActivated.addListener(async (info) =>
    chrome.tabs.get(info.tabId).then(updateTabContextMenu),
  );

  getCurrentTab().then((tab) => tab && updateTabContextMenu(tab));
  updateCount();
  setupDupeLinkMenu();
}

main();
