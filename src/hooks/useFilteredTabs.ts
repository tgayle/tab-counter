import { useState, useEffect } from 'react';
import { Tab } from '../tabutil';

export enum TabFilterType {
  Audible = 'audible',
  All = 'all',
  CurrentWindow = 'currentWindow',
}

export enum SortOrder {
  Count = 'count',
  Asc = 'asc',
  Desc = 'desc',
}

export function useFilteredTabs(tabs: Tab[], searchQuery: string = '') {
  const [filter, setFilter] = useState<TabFilterType>(TabFilterType.All);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Count);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Record<string, Tab[]>>({});
  const [sortedDomains, setSortedDomains] = useState<
    { domain: string; tabs: Tab[] }[]
  >([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setDomains({});
      let filteredTabs = await filterTabs(filter, tabs);

      if (searchQuery.trim()) {
        filteredTabs = filteredTabs.filter(
          (tab) =>
            tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tab.url?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      setLoading(false);
      const newDomains = getDomainGroups(filteredTabs);
      setDomains(newDomains);
      setSortedDomains(sortDomains(newDomains, sortOrder));
    })();
  }, [tabs, filter, sortOrder, searchQuery]);

  return {
    filter,
    loading,
    domains,
    sortedDomains,
    sortOrder,
    setSortOrder,
    setFilter: (newFilter: TabFilterType) => {
      if (newFilter === filter) {
        setFilter(TabFilterType.All);
      } else {
        setFilter(newFilter);
      }
    },
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

function getDomainGroups(tabs: Tab[]) {
  return tabs.reduce((domains, tab) => {
    const url = new URL(tab.url!);
    const origin = getDisplayOriginForUrl(url);
    const domainUrls = domains[origin] || [];
    domainUrls.push(tab);
    domains[origin] = domainUrls;

    return domains;
  }, {} as Record<string, Tab[]>);
}

function sortDomains(domains: Record<string, Tab[]>, order: SortOrder) {
  const keys = Object.keys(domains);

  let sortedDomains: string[];

  switch (order) {
    case SortOrder.Asc:
      sortedDomains = keys.sort();
      break;
    case SortOrder.Desc:
      sortedDomains = keys.sort().reverse();
      break;
    case SortOrder.Count:
      sortedDomains = keys.sort(
        (firstDomain, secondDomain) =>
          domains[secondDomain].length - domains[firstDomain].length,
      );
      break;
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

async function filterTabs(filter: TabFilterType, tabs: Tab[]): Promise<Tab[]> {
  switch (filter) {
    case TabFilterType.All:
      return tabs;
    case TabFilterType.Audible:
      return tabs.filter((tab) => tab.audible);
    case TabFilterType.CurrentWindow: {
      const currentWindow = await chrome.windows.getCurrent();
      return tabs.filter((tab) => tab.windowId === currentWindow.id);
    }
  }
}
