import browser from 'webextension-polyfill';
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { TabGrouper } from '../action/grouping/TabGrouper';
import { GroupTabsByOptions, TabFilterType } from '../action/TabFilter';
import { ActiveTab } from '../store';
import { BrowserWindow, getCurrentWindow, getTabInfo } from '../tabutil';
import { groupingRulesAtom } from './rules';
import { tabFilterAtom } from './settings';
import { expandedSectionsAtom, selectedTabAtom } from './ui';
import { TabGroupingStrategies } from '../action/grouping/TabGroupingStrategies';

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
  let timer: {
    id: NodeJS.Timeout | number;
    origin: string;
  } | null = null;

  const updateTabs = (reason: string) => () => {
    if (timer) {
      console.log(`Debounced a tab update, type = ${timer.origin}`);
      clearTimeout(timer.id as NodeJS.Timeout);
      timer = null;
    }

    timer = {
      id: setTimeout(async () => {
        console.log(`${Date.now()} Updating Tabs: ${reason}`);
        const { tabs } = await getTabInfo();
        setAtom(tabs);
        timer = null;
      }, 150),
      origin: reason,
    };
  };

  const onCreate = updateTabs('onCreated');
  const onRemove = updateTabs('onRemoved');
  const onUpdate = updateTabs('onUpdated');
  const onWindowCreate = updateTabs('windowCreated');
  const onWindowRemove = updateTabs('windowRemoved');

  browser.tabs.onCreated.addListener(onCreate);
  browser.tabs.onRemoved.addListener(onRemove);
  browser.tabs.onUpdated.addListener(onUpdate);
  browser.windows.onCreated.addListener(onWindowCreate);
  browser.windows.onRemoved.addListener(onWindowRemove);

  updateTabs('init')();

  return () => {
    browser.tabs.onCreated.removeListener(onCreate);
    browser.tabs.onRemoved.removeListener(onRemove);
    browser.tabs.onUpdated.removeListener(onUpdate);
    browser.windows.onCreated.removeListener(onWindowCreate);
    browser.windows.onRemoved.removeListener(onWindowRemove);
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

    if (
      filters.grouping.groupBy === GroupTabsByOptions.Domain ||
      filters.tabs.type === TabFilterType.Duplicates
    ) {
      return tabGrouper.filter(
        targetTabs,
        filters,
        TabGroupingStrategies.Origin,
      );
    } else {
      return await tabGrouper.filter(
        targetTabs,
        filters,
        TabGroupingStrategies.Window,
      );
    }
  }),
);
