import browser from 'webextension-polyfill';
import { Tab } from '../../tabutil';
import { TabFilterType, TabSortOrder } from '../TabFilter';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import { defaultRules } from './defaultRules';
import { TabGroupingStrategy } from './TabGroupingStrategy';
import {
  WindowGroupedOutput,
  WindowGroupedOutputResult,
} from './WindowGroupingStrategy';
import {
  TabGroupedOutput,
  TabGroupedOutputResult,
} from './TabGroupGroupingStrategy';
import {
  DomainGroupedOutputResult,
  DomainGroupedOutput,
} from './OriginGroupingStrategy';
import {
  ExpressionGroupedOutputResult,
  ExpressionGroupedOutput,
} from './ExpressionGroupingStrategy';

export type Rule = {
  id: string;
  displayName: string | null;
  origin: string;
  pathname: string | null;
  queryParams: string[];
  useExactPath?: boolean;
  regex?: string;
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

export type ParsedUriWithTab = Exclude<ParsedUri, 'tab'> & { tab: Tab };

export const tabToUri = (tab: Tab): ParsedUriWithTab | null => {
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

export type TabGroupOutputResult =
  | WindowGroupedOutputResult
  | DomainGroupedOutputResult
  | ExpressionGroupedOutputResult
  | TabGroupedOutputResult;
export type TabGroupResult =
  | WindowGroupedOutput
  | DomainGroupedOutput
  | ExpressionGroupedOutput
  | TabGroupedOutput;

export class TabGrouper {
  activeRules: Rule[] = [];

  constructor(public windowId: number = -1, overrideRules?: Rule[]) {
    if (overrideRules) {
      this.activeRules = overrideRules;
    } else {
      this.getActiveRules();
    }
  }

  private async getActiveRules(): Promise<Rule[]> {
    const { rules } = await browser.storage.sync.get({
      rules: defaultRules,
    });

    const result = Array.isArray(rules) ? rules : defaultRules;
    this.activeRules = result;
    return this.activeRules;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async filter<T extends TabGroupingStrategy<any, any, TabGroupResult>>(
    tabs: Tab[],
    filters: Filters,
    strategy: T,
  ): Promise<ReturnType<T['buildResult']>> {
    if (!tabs.length) {
      return {
        type: strategy.type,
        stats: {
          audible: [],
          muted: [],
          duplicates: [],
        },
        results: [],
      } as ReturnType<T['buildResult']>;
    }

    const start = Date.now();
    tabs = this.filterBySearch(tabs, filters.query);
    const stats = this.getStatsUsingRules(tabs, this.activeRules, strategy);

    const groups = await strategy.buildResult(
      this.filterByTabType(tabs, filters.tabs.type, stats.duplicates),
      this.activeRules,
      filters,
      stats,
    );

    console.log(
      `Sorted ${tabs.length} tabs into ${groups.results.length} groups in ${
        Date.now() - start
      }ms`,
    );

    return groups as ReturnType<T['buildResult']>;
  }

  protected filterByTabType(
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

  private getStatsUsingRules(
    tabs: Tab[],
    rules: Rule[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    strategy: TabGroupingStrategy<any, any, any>,
  ): TabStats {
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
        const defaultRule = strategy.getDefaultRule(uri);
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
    await browser.storage.sync.set({
      rules,
    });
  }

  observeRules(onRulesChanged: (rules: Rule[]) => void) {
    this.getActiveRules().then(onRulesChanged);
    const listener = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'sync') return;
      if (changes.rules) {
        onRulesChanged(changes.rules.newValue ?? []);
      }
    };
    browser.storage.onChanged.addListener(listener);
    return listener;
  }

  unobserveRules(
    listener: (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string,
    ) => void,
  ) {
    browser.storage.onChanged.removeListener(listener);
  }
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

export function isRuleApplicableToTab(uri: ParsedUri, rule: Rule): boolean {
  if (rule.regex) {
    const parsedRegex = (() => {
      try {
        return new RegExp(rule.regex);
      } catch (e) {
        return null;
      }
    })();

    if (!parsedRegex || !uri.tab) return false;

    return (
      !!uri.tab.title?.match(parsedRegex) ||
      !!uri.tab.url?.toLowerCase().match(new RegExp(parsedRegex.source, 'i'))
    );
  }

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

export function sortTabs<
  TabDataType extends { title?: string; url?: string; index?: number },
>(tabs: TabDataType[], by: TabSortOrder): TabDataType[] {
  return tabs.sort((a, b) => {
    const titleA = a.title ?? a.url ?? a.index ?? -1;
    const titleB = b.title ?? b.url ?? b.index ?? -1;
    switch (by) {
      case TabSortOrder.Asc:
        return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
      case TabSortOrder.Desc:
        return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
    }
  });
}
