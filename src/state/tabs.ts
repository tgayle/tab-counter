import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { TabGrouper } from '../action/grouping/TabGrouper';
import { GroupTabsByOptions } from '../action/TabFilter';
import { ActiveTab } from '../store';
import { BrowserWindow, getCurrentWindow, getTabInfo } from '../tabutil';
import { groupingRulesAtom } from './rules';
import { tabFilterAtom } from './settings';
import { expandedSectionsAtom, selectedTabAtom } from './ui';

export const tabGrouper = new TabGrouper();
export const currentWindowAtom = atom<BrowserWindow | null>(null);
currentWindowAtom.onMount = (set) => {
  getCurrentWindow().then((window) => {
    tabGrouper.windowId = window.id ?? -1;
    set(window);
  });
};

export const searchVisibleAtom = atom<boolean>(false);

export const searchQueryAtom = atom(
  (get) => get(tabFilterAtom).query,
  (get, set, query: string) => {
    set(tabFilterAtom, {
      ...get(tabFilterAtom),
      query,
    });

    if (!query) {
      set(expandedSectionsAtom, new Set());
    }
  },
);

const tabsAtom = atom<Awaited<ReturnType<typeof getTabInfo>>['tabs']>({
  normal: [],
  incognito: [],
  all: [],
});

tabsAtom.onMount = (setAtom) => {
  const updateTabs = (reason: string) => async () => {
    console.log(`Updating Tabs: ${reason}`);
    const { tabs } = await getTabInfo();
    setAtom(tabs);
  };

  const onCreate = updateTabs('onCreated');
  const onRemove = updateTabs('onRemoved');
  const onUpdate = updateTabs('onUpdated');
  const onWindowCreate = updateTabs('windowCreated');
  const onWindowRemove = updateTabs('windowRemoved');

  chrome.tabs.onCreated.addListener(onCreate);
  chrome.tabs.onRemoved.addListener(onRemove);
  chrome.tabs.onUpdated.addListener(onUpdate);
  chrome.windows.onCreated.addListener(onWindowCreate);
  chrome.windows.onRemoved.addListener(onWindowRemove);

  updateTabs('init')();

  return () => {
    chrome.tabs.onCreated.removeListener(onCreate);
    chrome.tabs.onRemoved.removeListener(onRemove);
    chrome.tabs.onUpdated.removeListener(onUpdate);
    chrome.windows.onCreated.removeListener(onWindowCreate);
    chrome.windows.onRemoved.removeListener(onWindowRemove);
  };
};

export const allTabsAtom = atom((get) => get(tabsAtom));

export const filteredTabGroups = loadable(
  atom(async (get) => {
    get(groupingRulesAtom);
    tabGrouper.windowId = get(currentWindowAtom)?.id ?? -1;
    const filters = get(tabFilterAtom);
    const tabs = get(allTabsAtom);
    const activeTab = get(selectedTabAtom);

    const targetTabs =
      activeTab === ActiveTab.All
        ? tabs.all
        : activeTab === ActiveTab.Normal
        ? tabs.normal
        : tabs.incognito;

    if (filters.grouping.groupBy === GroupTabsByOptions.Domain) {
      return tabGrouper.filterByRules(targetTabs, filters);
    } else {
      return await tabGrouper.filterByWindows(targetTabs, filters);
    }
  }),
);
