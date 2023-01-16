import { BrowserWindow, getAllWindows, Tab } from '../../tabutil';
import { GroupSortOrder, TabFilterType, TabSortOrder } from '../TabFilter';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import { defaultRules } from './defaultRules';

export type Rule = {
  id: string;
  displayName: string | null;
  origin: string;
  pathname: string | null;
  queryParams: string[];
  useExactPath?: boolean;
};

type ParsedUri = {
  origin: string;
  hostname: string;
  protocol: string;
  pathname: string;
  queryParams: Record<string, string>;
  originalUri: string;
  tab?: Tab;
};

type ParsedUriWithTab = Exclude<ParsedUri, 'tab'> & { tab: Tab };

const tabToUri = (tab: Tab): ParsedUriWithTab | null => {
  if (!tab.url) return null;
  try {
    const url = new URL(tab.url);
    return {
      hostname: url.hostname,
      protocol: url.protocol,
      origin: url.origin,
      pathname: url.pathname,
      queryParams: Object.fromEntries(url.searchParams.entries()),
      originalUri: tab.url,
      tab,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

type DomainGroupedOutputResult = {
  origin: string;
  tabs: Tab[];
  displayName: string;
  rule: Rule | null;
};
type DomainGroupedOutput = {
  type: 'domain';
  stats: TabStats;
  results: DomainGroupedOutputResult[];
};

type WindowGroupedOutputResult = {
  displayName: string;
  window: BrowserWindow;
  tabs: Tab[];
};

type WindowGroupedOutput = {
  type: 'window';
  stats: TabStats;
  results: WindowGroupedOutputResult[];
};

export type TabGroupResult = WindowGroupedOutput | DomainGroupedOutput;

export class TabGrouper {
  activeRules: Rule[] = [];

  constructor() {
    this.getActiveRules();
  }

  private async getActiveRules(): Promise<Rule[]> {
    const { rules } = await chrome.storage.sync.get({
      rules: defaultRules,
    });

    const result = Array.isArray(rules) ? rules : defaultRules;
    this.activeRules = result;
    return this.activeRules;
  }

  windowId = -1;

  async filterByWindows(
    tabs: Tab[],
    {
      tabs: { sortBy: tabOrder, type },
      query,
      grouping: { sortBy: groupOrder },
    }: Filters,
  ): Promise<WindowGroupedOutput> {
    const start = Date.now();
    const windows = await getAllWindows();
    tabs = this.filterBySearch(tabs, query);
    const stats = this.getStatsUsingRules(tabs, this.activeRules);

    const tabsByWindow = this.filterByTabType(
      tabs,
      type,
      stats.duplicates,
    ).reduce((acc, tab) => {
      const tabs = acc[tab.windowId] || [];
      tabs.push(tab);
      acc[tab.windowId] = tabs;
      return acc;
    }, {} as Record<number, Tab[]>);

    const groups = windows.map((window): WindowGroupedOutputResult => {
      return {
        window,
        displayName: `Window ${window.id}`,
        tabs: this.sortTabs(tabsByWindow[window.id!] || [], tabOrder),
      };
    });

    const results = this.sortGroups(groups, groupOrder);

    console.log(
      `Sorted ${tabs.length} tabs into ${windows.length} windows in ${
        Date.now() - start
      }ms`,
    );
    return {
      type: 'window',
      stats,
      results,
    };
  }

  filterByRules(tabs: Tab[], filters: Filters): DomainGroupedOutput {
    const {
      query,
      grouping: { sortBy: groupOrder },
    } = filters;
    const { sortBy: tabOrder, type } = filters.tabs;
    const start = Date.now();
    tabs = this.filterBySearch(tabs, query);
    const stats = this.getStatsUsingRules(tabs, this.activeRules);
    const [tabsByRule, unparsableTabs] = bucketTabsByRules(
      this.filterByTabType(tabs, type, stats.duplicates),
      this.activeRules,
    );

    const groups = [...tabsByRule.entries()].map(
      ([rule, tabs]): DomainGroupedOutputResult => {
        return {
          rule,
          displayName: rule.displayName ?? rule.origin,
          origin: rule.origin,
          tabs: this.sortTabs(
            tabs.map((it) => it.tab),
            tabOrder,
          ),
        };
      },
    );

    const results = [
      ...this.sortGroups(groups, groupOrder),
      {
        displayName: 'Unknown',
        origin: 'unknown',
        rule: null,
        tabs: unparsableTabs,
      },
    ].filter((it) => it.tabs.length);

    console.log(
      `Grouped ${tabs.length} tabs with ${this.activeRules.length} rules in ${
        Date.now() - start
      }ms`,
    );
    return {
      type: 'domain',
      stats,
      results,
    };
  }

  private sortGroups<
    T extends DomainGroupedOutputResult | WindowGroupedOutputResult,
  >(items: T[], by: GroupSortOrder) {
    return items.sort((a, b) => {
      switch (by) {
        case GroupSortOrder.Count:
          return b.tabs.length - a.tabs.length;
        case GroupSortOrder.Asc:
          return a.displayName < b.displayName
            ? -1
            : a.displayName > b.displayName
            ? 1
            : 0;
        case GroupSortOrder.Desc:
          return a.displayName > b.displayName
            ? -1
            : a.displayName < b.displayName
            ? 1
            : 0;
      }
    });
  }

  private sortTabs(tabs: Tab[], by: TabSortOrder): Tab[] {
    return tabs.sort((a, b) => {
      const titleA = a.title ?? a.url ?? a.index;
      const titleB = b.title ?? b.url ?? b.index;
      switch (by) {
        case TabSortOrder.Asc:
          return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
        case TabSortOrder.Desc:
          return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
      }
    });
  }

  private getStatsUsingRules(tabs: Tab[], rules: Rule[]): TabStats {
    const audible: Tab[] = [];
    const muted: Tab[] = [];

    const tabsByKey: Record<string, Tab[]> = {};

    for (const tab of tabs) {
      if (tab.audible) {
        audible.push(tab);
      }
      if (tab.mutedInfo?.muted) {
        muted.push(tab);
      }

      const uri = tabToUri(tab);
      if (!uri) continue;

      let hadRule = false;
      for (const rule of rules) {
        const tabKey = getTabKeyFromRule(uri, rule);
        if (tabKey) {
          hadRule = true;
          const similarTabs = tabsByKey[tabKey] || [];
          similarTabs.push(tab);
          tabsByKey[tabKey] = similarTabs;
        }
      }

      if (!hadRule) {
        const defaultRule = getDefaultRuleForOrigin(uri.origin);
        const tabKey = getTabKeyFromRule(uri, defaultRule);
        if (tabKey) {
          const similarTabs = tabsByKey[tabKey] || [];
          similarTabs.push(tab);
          tabsByKey[tabKey] = similarTabs;
        }
      }
    }

    return {
      audible,
      muted,
      duplicates: Object.values(tabsByKey)
        .filter((it) => it.length > 1)
        .flat(),
    };
  }

  private filterByTabType(
    tabs: Tab[],
    type: TabFilterType,
    knownDuplicates: Tab[],
  ): Tab[] {
    switch (type) {
      case TabFilterType.All:
        return tabs;
      case TabFilterType.Audible:
        return tabs.filter((it) => it.audible);
      case TabFilterType.CurrentWindow:
        return tabs.filter((it) => it.windowId === this.windowId);
      case TabFilterType.Duplicates:
        return tabs.filter((it) => knownDuplicates.includes(it));
    }
  }

  private filterBySearch(tabs: Tab[], query: string): Tab[] {
    if (query.trim().length === 0) return tabs;
    query = query.toLowerCase();

    return tabs.filter((tab) => {
      const title = tab.title || '';
      const url = tab.url || '';

      return (
        title.toLowerCase().includes(query) || url.toLowerCase().includes(query)
      );
    });
  }

  async restoreDefaultRules() {
    await this.updateRules(defaultRules);
  }

  async updateRules(rules: Rule[]) {
    this.activeRules = rules;
    await chrome.storage.sync.set({
      rules,
    });
  }

  observeRules(onRulesChanged: (rules: Rule[]) => void) {
    this.getActiveRules().then(onRulesChanged);
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'sync') return;
      if (changes.rules) {
        onRulesChanged(changes.rules.newValue ?? []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return listener;
  }

  unobserveRules(
    listener: (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => void,
  ) {
    chrome.storage.onChanged.removeListener(listener);
  }
}

function bucketTabsByRules(tabs: Tab[], rules: Rule[]) {
  const rulesByOrigin = groupRulesByOrigin(rules);
  const [tabsByOrigin, unparsableTabs] = groupTabsByOrigin(tabs);
  const tabsWithAssociatedRule: [tab: ParsedUriWithTab, ruleUsed: Rule][] = [];

  for (const origin in tabsByOrigin) {
    // Create a catch-all rule for each origin
    {
      const originRules = rulesByOrigin[origin] ?? [];
      originRules.push(getDefaultRuleForOrigin(origin));
      rulesByOrigin[origin] = originRules;
    }

    const originTabs = tabsByOrigin[origin];

    const [normalRules, catchallRules] = partition(
      rulesByOrigin[origin],
      (rule) => rule.pathname !== null,
    );

    tabLoop: for (const tab of originTabs) {
      for (const rule of normalRules) {
        if (isRuleApplicableToTab(tab, rule)) {
          tabsWithAssociatedRule.push([tab, rule]);
          continue tabLoop;
        }
      }

      // None of the normal rules could handle this tab, try the catchall rules
      for (const rule of catchallRules) {
        if (isRuleApplicableToTab(tab, rule)) {
          tabsWithAssociatedRule.push([tab, rule]);
          continue tabLoop;
        }
      }
    }
  }

  const ruleToTab = new Map<Rule, ParsedUriWithTab[]>();
  for (const [tab, rule] of tabsWithAssociatedRule) {
    const tabs = ruleToTab.get(rule) ?? [];
    tabs.push(tab);
    ruleToTab.set(rule, tabs);
  }

  return [ruleToTab, unparsableTabs] as const;
}

function getTabKeyFromRule(uri: ParsedUri, rule: Rule) {
  if (!isRuleApplicableToTab(uri, rule)) {
    return null;
  }

  const { origin, pathname, queryParams } = uri;
  return `${origin}_${pathname}_${rule.queryParams
    .map((param) => queryParams[param])
    .join('-')}`;
}

function isRuleApplicableToTab(uri: ParsedUri, rule: Rule): boolean {
  if (uri.origin !== rule.origin) return false;
  if (rule.pathname) {
    if (rule.useExactPath && uri.pathname !== rule.pathname) return false;
    if (!rule.useExactPath && !uri.pathname.startsWith(rule.pathname))
      return false;
  }

  if (rule.queryParams.length) {
    return rule.queryParams.every((param) => param in uri.queryParams);
  }

  return true;
}

function getDefaultRuleForOrigin(origin: string): Rule {
  return {
    origin: origin,
    id: `default_${origin}`,
    pathname: null,
    queryParams: [],
    displayName: origin.startsWith('https://') ? origin.slice(8) : origin,
  };
}

function groupTabsByOrigin(tabs: Tab[]) {
  const tabsByOrigin: Record<string, ParsedUriWithTab[]> = {};
  const invalidTabs: Tab[] = [];
  for (const tab of tabs) {
    const uri = tabToUri(tab);

    if (!uri) {
      invalidTabs.push(tab);
      continue;
    }

    const { origin } = uri;
    if (!tabsByOrigin[origin]) {
      tabsByOrigin[origin] = [];
    }
    tabsByOrigin[origin].push(uri);
  }
  return [tabsByOrigin, invalidTabs] as const;
}

function groupRulesByOrigin(rules: Rule[]) {
  const rulesByOrigin: Record<string, Rule[]> = {};
  for (const rule of rules) {
    const { origin } = rule;
    if (!rulesByOrigin[origin]) {
      rulesByOrigin[origin] = [];
    }
    rulesByOrigin[origin].push(rule);
  }
  return rulesByOrigin;
}

function partition<T>(items: T[], condition: (item: T) => boolean): [T[], T[]] {
  const trueItems: T[] = [];
  const falseItems: T[] = [];
  for (const item of items) {
    if (condition(item)) {
      trueItems.push(item);
    } else {
      falseItems.push(item);
    }
  }
  return [trueItems, falseItems];
}
