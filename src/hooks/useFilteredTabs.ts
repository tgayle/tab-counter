import { useState, useEffect } from 'react';
import { Tab, BrowserWindow } from '../tabutil';
import {
  useFilterSettings,
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
  FilterSettings,
} from './useFilterSettings';

type GroupedTab = {
  tabs: Tab[];
};

export type GroupedTabType = DomainGroupedTabs | WindowGroupedTabs;

type DomainGroupedTabs = GroupedTab & {
  grouping: 'domain';
  filteredTabs: { domain: string; tabs: Tab[] }[];
};

type WindowGroupedTabs = GroupedTab & {
  grouping: 'window';
  filteredTabs: { window: BrowserWindow; tabs: Tab[] }[];
};

type UseFilteredTabs = {
  loading: boolean;
  type: GroupedTabType['grouping'];
  groupedTabs: GroupedTabType;
  allTabs: Tab[];
  sortOptions: FilterSettings;
};

export function useFilteredTabs(
  tabs: Tab[],
  searchQuery: string = '',
): UseFilteredTabs {
  const [loading, setLoading] = useState(true);
  const [allTabs, setAllTabs] = useState<Tab[]>([]);
  const [groupedTabs, setGroupedTabs] = useState<GroupedTabType>({
    filteredTabs: [],
    grouping: 'domain',
    tabs: [],
  });

  const sortOptions = useFilterSettings();

  useEffect(() => {
    const { groupSortBy, loaded, tabFilterType, tabGrouping, tabSortBy } =
      sortOptions;

    if (!loaded) {
      return;
    }
    (async () => {
      setLoading(true);

      // 1. Filter tabs down to desired tabs.
      const filteredTabs = await filterTabs(tabFilterType, tabs, searchQuery);
      setAllTabs(filteredTabs);

      // 2. Sort/Group tabs
      // 3. Sort tabs in each group
      switch (tabGrouping) {
        case GroupTabsByOptions.Domain: {
          setGroupedTabs({
            filteredTabs: sortDomains(
              groupSortBy,
              tabSortBy,
              groupTabsByDomain(filteredTabs),
            ),
            grouping: 'domain',
            tabs: filteredTabs,
          });
          break;
        }
        case GroupTabsByOptions.Window: {
          setGroupedTabs({
            filteredTabs: sortWindows(
              groupSortBy,
              tabSortBy,
              await groupTabsByWindow(filteredTabs),
            ),
            grouping: 'window',
            tabs: filteredTabs,
          });
          break;
        }
      }

      setLoading(false);
    })();
  }, [
    sortOptions.loaded,
    sortOptions.groupSortBy,
    sortOptions.tabFilterType,
    sortOptions.tabGrouping,
    sortOptions.tabSortBy,
  ]);

  return {
    loading,
    allTabs,
    groupedTabs,
    sortOptions,
    type: sortOptions.tabGrouping,
  };
}

function getDisplayOriginForUrl(url: URL) {
  const origin = url.origin;
  if (origin.startsWith('file://')) {
    return 'Files';
  } else if (origin === 'chrome://newtab') {
    return 'New Tabs';
  } else {
    return url.host;
  }
}

async function filterTabs(
  filter: TabFilterType,
  tabs: Tab[],
  query?: string,
): Promise<Tab[]> {
  if (query?.trim()) {
    tabs = tabs.filter(
      (tab) =>
        tab.title?.toLowerCase().includes(query.toLowerCase()) ||
        tab.url?.toLowerCase().includes(query.toLowerCase()),
    );
  }

  switch (filter) {
    case TabFilterType.All:
      return tabs;
    case TabFilterType.Audible:
      return tabs.filter((tab) => tab.audible);
    case TabFilterType.CurrentWindow: {
      const currentWindow = await chrome.windows.getCurrent();
      return tabs.filter((tab) => tab.windowId === currentWindow.id);
    }
    default:
      throw new Error(`Unexpected tab filter type: ${filter}`);
  }
}

async function groupTabsByWindow(tabs: Tab[]) {
  const windows = await chrome.windows.getAll();

  const tabWindows = tabs.reduce((map, tab) => {
    const arr = map[tab.windowId] || [];
    arr.push(tab);
    map[tab.windowId] = arr;
    return map;
  }, {} as Record<number, Tab[]>);

  return Object.keys(tabWindows).reduce((map, _windowId: string) => {
    const windowId = +_windowId;
    const tabWindow = windows.find((window) => window.id === windowId);
    map[windowId] = {
      window: tabWindow!,
      tabs: tabWindows[windowId],
    };
    return map;
  }, {} as Record<number, { window: BrowserWindow; tabs: Tab[] }>);
}

function groupTabsByDomain(tabs: Tab[]) {
  return tabs.reduce((domains, tab) => {
    const url = new URL(tab.url!);
    const origin = getDisplayOriginForUrl(url);
    const domainUrls = domains[origin] || [];
    domainUrls.push(tab);
    domains[origin] = domainUrls;

    return domains;
  }, {} as Record<string, Tab[]>);
}

function sortWindows(
  order: GroupSortOrder,
  tabOrder: TabSortOrder,
  windows: Record<number, { window: BrowserWindow; tabs: Tab[] }>,
): { window: BrowserWindow; tabs: Tab[] }[] {
  return Object.values(windows).sort(
    ({ window: windowA }, { window: windowB }) =>
      (windowA.id ?? 0) - (windowB.id ?? 0),
  );
}

function sortDomains(
  order: GroupSortOrder,
  tabOrder: TabSortOrder,
  domains: Record<string, Tab[]>,
) {
  const keys = Object.keys(domains);

  let sortedDomains: string[];

  switch (order) {
    case GroupSortOrder.Asc:
      sortedDomains = keys.sort();
      break;
    case GroupSortOrder.Desc:
      sortedDomains = keys.sort().reverse();
      break;
    case GroupSortOrder.Count:
      sortedDomains = keys.sort(
        (firstDomain, secondDomain) =>
          domains[secondDomain].length - domains[firstDomain].length,
      );
      break;
    default:
      throw new Error(`Unexpected sort order: ${order}`);
  }

  return sortedDomains.map((domain) => ({
    domain,
    tabs: domains[domain].sort((tabA, tabB) => {
      const titleA = tabA.title ?? '';
      const titleB = tabB.title ?? '';
      return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
    }),
  }));
}
