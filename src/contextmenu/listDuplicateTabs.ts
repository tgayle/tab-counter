// Right clicking within a tab will show duplicate tabs.
import browser from 'webextension-polyfill';
import { TabGrouper } from '../action/grouping/TabGrouper';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from '../action/TabFilter';
import {
  focusTab,
  Tab,
  getTabInfo,
  partition,
  setCurrentWindow,
} from '../tabutil';

const ROOT_MENU = 'tab_counter_root_menu';

const DUPE_TABS = 'tab_counter_dupe_list';

const RELATED_TABS = 'tab_counter_related_list';

const grouper = new TabGrouper();

browser.contextMenus.onClicked.addListener(async (info) => {
  const menuId = info.menuItemId.toString();
  if (menuId.startsWith(`${DUPE_TABS}_`)) {
    const tabId = menuId.split('_').at(-1);

    if (typeof tabId !== 'undefined') {
      focusTab(+tabId);
    }
  }
});

let rootMenuExists = false;

export async function updateTabContextMenu(tab: Tab) {
  console.log('Update context menu?', tab.id);
  setCurrentWindow(tab.windowId ?? -1);

  if (!tab.url) return;

  if (!rootMenuExists) {
    try {
      await createRootMenu({
        rootId: ROOT_MENU,
        title: 'Tab Counter',
        enabled: true,
      });
    } catch (e) {
      console.warn(e);
    }
    rootMenuExists = true;
  }

  const origin = new URL(tab.url).origin;

  const {
    tabs: { all: allTabs },
  } = await getTabInfo();

  const duplicateGroups = grouper.filterByRules(allTabs, {
    tabs: {
      type: TabFilterType.Duplicates,
      sortBy: TabSortOrder.Asc,
    },
    grouping: {
      groupBy: GroupTabsByOptions.Domain,
      sortBy: GroupSortOrder.Asc,
    },
    query: origin,
  });

  const relatedGroups = grouper.filterByRules(allTabs, {
    tabs: {
      type: TabFilterType.All,
      sortBy: TabSortOrder.Asc,
    },
    grouping: {
      groupBy: GroupTabsByOptions.Domain,
      sortBy: GroupSortOrder.Asc,
    },
    query: origin,
  });

  const similarTabs = duplicateGroups.results
    .filter((group) => group.tabs.some((it) => it.id === tab.id))
    .map((it) => it.tabs)
    .flat();

  const relatedTabs = relatedGroups.results
    .filter((group) => group.tabs.some((it) => it.id === tab.id))
    .map((it) => it.tabs)
    .flat();

  await createRootMenu({
    rootId: DUPE_TABS,
    subitems: similarTabs,
    title: 'Related Tabs',
  });

  await createRootMenu({
    rootId: RELATED_TABS,
    title: 'Similar Tabs',
    subitems: relatedTabs,
  });
}

async function createRootMenu({
  subitems = [],
  enabled = subitems.length > 0,
  rootId,
  title,
}: {
  rootId: string;
  subitems?: Tab[];
  enabled?: boolean;
  title: string;
}) {
  const activeWindow = await browser.windows.getCurrent();
  try {
    await browser.contextMenus.remove(rootId);
  } catch (e) {
    console.warn('[createRootMenu]', e);
    // it's fine if the menu doesn't already exist
  }

  return await new Promise<void>((resolve, reject) => {
    browser.contextMenus.create(
      {
        id: rootId,
        title: title,
        contexts: ['page'],
        enabled,
        parentId: ROOT_MENU === rootId ? undefined : ROOT_MENU,
      },
      () => {
        if (browser.runtime.lastError) {
          return reject(browser.runtime.lastError);
        }

        console.log(browser.runtime.lastError);

        const [activeTabs, inactiveTabs] = partition(
          subitems,
          (it) => it.active,
        );

        const sortedActiveTabs = activeTabs.sort((a, b) =>
          a.windowId === activeWindow.id
            ? -1
            : b.windowId === activeWindow.id
            ? -1
            : 0,
        );

        for (const tab of sortedActiveTabs.concat(inactiveTabs)) {
          browser.contextMenus.create({
            id: `${rootId}_${tab.id}`,
            title: `${tab.incognito ? '(🥸)' : ''}${tab.title}`,
            contexts: ['page'],
            parentId: rootId,
            checked: tab.active && tab.windowId === activeWindow.id,
            enabled:
              tab.active && tab.windowId === activeWindow.id ? false : true,
            type:
              tab.active && tab.windowId === activeWindow.id
                ? 'radio'
                : 'normal',
          });
        }

        resolve();
      },
    );
  });
}
