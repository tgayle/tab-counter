import { Tab, getTabInfo } from '../../tabutil';
import { presetDuplicateResolvers } from './DeduplicationPreset';

export enum DuplicatePolicy {
  Exact,
  BasePath,
  Presets,
}

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

export function groupAndFilterDuplicateTabs(
  tabs: Tab[],
  policy: DuplicatePolicy,
) {
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

  let url: string;
  if (typeof tabOrUrl === 'string') {
    url = tabOrUrl;
  } else if (tabOrUrl.url) {
    url = tabOrUrl.url;
  } else {
    return [];
  }

  const currentUrl = new URL(url);

  return filterDuplicateTabs(
    currentUrl,
    allTabs.tabs.all
      .filter((it: Tab): it is Omit<Tab, 'url'> & { url: string } => !!it.url)
      .map((tab) => ({ tab, url: new URL(tab.url) })),
    duplicatePolicy,
  );
}
