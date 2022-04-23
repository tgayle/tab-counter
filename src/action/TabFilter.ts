import { BrowserWindow, getCurrentWindow, getTabInfo, Tab } from '../tabutil';

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
    const url = new URL(tab.url!);
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

export enum DuplicatePolicy {
  Exact,
  BasePath,
  Presets,
}

const presetDuplicateResolvers: Record<
  string,
  (url1: URL, url2: URL) => boolean
> = {
  'https://www.youtube.com/watch': (url1, url2) => {
    return url1.searchParams.get('v') === url2.searchParams.get('v');
  },
  'https://www.google.com/search': (url1, url2) => {
    return url1.searchParams.get('q') === url2.searchParams.get('q');
  },
};

export function filterDuplicateTabs(
  sourceUrl: URL,
  tabs: { tab: Tab; url: URL }[],
  policy: DuplicatePolicy,
  seen = new Set<Tab>(),
): Tab[] {
  const fullUrl = sourceUrl.origin + sourceUrl.pathname;

  const dupes = tabs.filter(({ tab, url: tabUrl }) => {
    if (seen.has(tab)) return false;
    const tabFullUrl = tabUrl.origin + tabUrl.pathname;
    const sameBasePath = fullUrl === tabFullUrl;

    switch (policy) {
      case DuplicatePolicy.BasePath: {
        return sameBasePath;
      }
      case DuplicatePolicy.Exact: {
        return tabUrl.href === sourceUrl.href;
      }
      case DuplicatePolicy.Presets: {
        if (sameBasePath && presetDuplicateResolvers[fullUrl]) {
          return presetDuplicateResolvers[fullUrl](sourceUrl, tabUrl);
        }

        return sameBasePath;
      }
    }
  });

  const dupedTabs = dupes.map((it) => it.tab);
  if (dupedTabs.length === 1) return [];
  return dupedTabs;
}

function groupAndFilterDuplicateTabs(tabs: Tab[], policy: DuplicatePolicy) {
  const tabsByBaseUrl: Record<string, { tab: Tab; url: URL }[]> = {};
  for (const tab of tabs) {
    if (!tab.url) continue;
    const url = new URL(tab.url);
    const base = url.origin + url.pathname;
    const all = tabsByBaseUrl[base] || [];
    all.push({ tab, url });
    tabsByBaseUrl[base] = all;
  }

  const all: Tab[] = [];

  for (const tabsForBase of Object.values(tabsByBaseUrl)) {
    if (tabsForBase.length === 1) continue;
    const seen = new Set<Tab>();
    for (const { url } of tabsForBase) {
      const dupes = filterDuplicateTabs(url, tabsForBase, policy, seen);
      all.push(...dupes);
      dupes.forEach((it) => seen.add(it));
    }
  }

  return all;
}

export async function findDuplicateTabs(
  tabOrUrl: Tab | string,
  duplicatePolicy: DuplicatePolicy = DuplicatePolicy.Presets,
) {
  const allTabs = await getTabInfo();

  const currentUrl = new URL(
    typeof tabOrUrl === 'string' ? tabOrUrl : tabOrUrl.url!,
  );

  return filterDuplicateTabs(
    currentUrl,
    allTabs.tabs.all.map((tab) => ({ tab, url: new URL(tab.url!) })),
    duplicatePolicy,
  );
}
