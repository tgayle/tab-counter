import { useState, useEffect } from 'react';
import { Tab } from '../tabutil';

export type TabFilterArg = 'audible' | 'all' | 'currentwindow';
export type SortOrder = 'count' | 'asc' | 'desc';

export function useFilteredTabs(tabs: Tab[], searchQuery: string = '') {
  const [filter, setFilter] = useState<TabFilterArg>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('count');
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
    setFilter: (newFilter: TabFilterArg) => {
      if (newFilter === filter) {
        setFilter('all');
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
    case 'asc':
      sortedDomains = keys.sort();
      break;
    case 'desc':
      sortedDomains = keys.sort().reverse();
      break;
    case 'count':
      sortedDomains = keys.sort(
        (firstDomain, secondDomain) =>
          domains[secondDomain].length - domains[firstDomain].length,
      );
      break;
  }

  return sortedDomains.map((domain) => ({ domain, tabs: domains[domain] }));
}

async function filterTabs(filter: TabFilterArg, tabs: Tab[]): Promise<Tab[]> {
  switch (filter) {
    case 'all':
      return tabs;
    case 'audible':
      return tabs.filter((tab) => tab.audible);
    case 'currentwindow': {
      const currentWindow = await chrome.windows.getCurrent();
      return tabs.filter((tab) => tab.windowId === currentWindow.id);
    }
  }
}
