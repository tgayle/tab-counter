// Right clicking within a tab will show duplicate tabs.

import { findDuplicateTabs } from '../action/duplication/tabDeduplication';
import { getCurrentWindow, focusTab } from '../tabutil';

let contextMenuSetup = false;
let settingUpMenu = false;

chrome.contextMenus.onClicked.addListener(async (data, tab) => {
  const id = data.menuItemId.toString();

  if (id.startsWith('focus')) {
    const tabId = +id.substring('focus_'.length);
    const tab = await chrome.tabs.get(tabId);
    focusTab(tab, true);
  }
});

export async function updateTabContextMenu(tab: chrome.tabs.Tab) {
  if (settingUpMenu) return;
  settingUpMenu = true;

  const done = () => {
    contextMenuSetup = true;
    settingUpMenu = false;
  };

  const currentWindow = await getCurrentWindow();
  if (!(currentWindow.id === tab.windowId && tab.active) || !tab.url) {
    return done();
  }
  const createTabContextMenu = async () => {
    const dupes = await findDuplicateTabs(tab);

    if (dupes.length === 1) {
      done();
      contextMenuSetup = false;
      return;
    }

    chrome.contextMenus.create(
      {
        id: 'tab_counter_dupe_list',
        title: 'Tab Counter',
        contexts: ['page'],
      },
      () => {
        done();
        for (const dupe of dupes) {
          chrome.contextMenus.create({
            title: `${dupe.incognito ? '(Incognito) - ' : ''}${dupe.title}`,
            parentId: 'tab_counter_dupe_list',
            type: dupe.id === tab.id ? 'checkbox' : 'normal',
            checked: dupe.id === tab.id,
            id: `focus_${dupe.id}`,
          });
        }
      },
    );
  };

  if (contextMenuSetup) {
    chrome.contextMenus.remove('tab_counter_dupe_list', createTabContextMenu);
  } else {
    createTabContextMenu();
  }
}
