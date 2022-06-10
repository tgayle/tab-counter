import { BrowserWindow, getCurrentWindow, Tab } from '../tabutil';
import {
  groupAndFilterDuplicateTabs,
  DuplicatePolicy,
} from './duplication/tabDeduplication';

export enum TabFilterType {
  Audible = 'audible',
  All = 'all',
  CurrentWindow = 'currentWindow',
  Duplicates = 'dupes',
}

export enum GroupSortOrder {
  Count = 'count',
  Asc = 'asc',
  Desc = 'desc',
}

export enum GroupTabsByOptions {
  Domain = 'domain',
  Window = 'window',
}

export enum TabSortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export async function filterTabs(
  filter: TabFilterType,
  tabs: Tab[],
  query: string,
): Promise<Tab[]> {
  if (query.trim()) {
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
      const currentWindow = await getCurrentWindow();
      return tabs.filter((tab) => tab.windowId === currentWindow.id);
    }
    case TabFilterType.Duplicates: {
      return groupAndFilterDuplicateTabs(tabs, DuplicatePolicy.Presets);
    }
    default:
      throw new Error(`Unexpected tab filter type: ${filter}`);
  }
}

export async function groupTabsByWindow(tabs: Tab[]) {
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

function getDisplayOriginForUrl(url: URL) {
  const origin = url.origin;
  if (origin.startsWith('file://')) {
    return 'Files';
  } else if (origin === 'chrome://newtab') {
    return 'New Tabs';
  } else if (url.protocol.startsWith('chrome-extension')) {
    return `Extension: ${url.host}`;
  } else {
    return url.host;
  }
}

export function groupTabsByDomain(tabs: Tab[]) {
  return tabs.reduce((domains, tab) => {
    if (!tab.url) return domains;

    const url = new URL(tab.url);
    const origin = getDisplayOriginForUrl(url);
    const domainUrls = domains[origin] || [];
    domainUrls.push(tab);
    domains[origin] = domainUrls;

    return domains;
  }, {} as Record<string, Tab[]>);
}

export function sortWindows(
  order: GroupSortOrder,
  tabOrder: TabSortOrder,
  windows: Record<number, { window: BrowserWindow; tabs: Tab[] }>,
): { window: BrowserWindow; tabs: Tab[] }[] {
  return Object.values(windows).sort(
    ({ window: windowA }, { window: windowB }) =>
      (windowA.id ?? 0) - (windowB.id ?? 0),
  );
}

export function sortDomains(
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
