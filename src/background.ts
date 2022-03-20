import { getTabInfo } from './tabutil';

console.log('background script');

async function updateCount() {
  await chrome.action.setBadgeText({
    text: (await getTabInfo()).text,
  });
}

function main() {
  chrome.tabs.onCreated.addListener(updateCount);
  chrome.tabs.onRemoved.addListener(updateCount);
  updateCount();
}

main();
