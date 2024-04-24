import { Tab } from '../../tabutil';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import { ParsedUriWithTab, Rule } from './TabGrouper';
import { TabGroupingStrategy } from './TabGroupingStrategy';

export type TabGroupedOutputResult = {
  displayName: string;
  tabGroup: chrome.tabGroups.TabGroup;
  tabs: Tab[];
};

export type TabGroupedOutput = {
  type: 'tab_group';
  stats: TabStats;
  results: TabGroupedOutputResult[];
};

export class TabGroupGroupingStrategy extends TabGroupingStrategy<
  'tab_group',
  number,
  TabGroupedOutput
> {
  readonly type = 'tab_group';
  getDiscriminator(tab: Tab) {
    return tab.groupId ?? -1;
  }

  groupTabs(tabs: Tab[]) {
    const groupedValues = tabs.reduce(
      (acc, tab) => {
        tab.groupId ??= -1;
        const tabs = acc[tab.groupId] || [];
        tabs.push({ tab });
        acc[tab.groupId] = tabs;
        return acc;
      },
      {} as Record<number, { tab: Tab }[]>,
    );

    return {
      groupedValues,
      failed: [],
    };
  }

  groupRules(): Record<number, Rule[]> {
    // Rules don't really apply to tab groups.
    return {};
  }

  groupTabsByRules(): [Map<Rule, { tab: Tab }[]>, Tab[]] {
    return [new Map(), []];
  }

  getDefaultRule(uri: ParsedUriWithTab): Rule {
    return {
      displayName: `Tab Group ${uri.tab.groupId}`,
      id: `default_${uri.tab.groupId}`,
      origin: 'tab_group',
      pathname: null,
      queryParams: [],
    };
  }

  async buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<TabGroupedOutput> {
    const { groupedValues } = this.groupTabs(tabs);

    const results: TabGroupedOutputResult[] = await Promise.all(
      Object.entries(groupedValues).map(async ([groupId, tabs]) => {
        const tabGroup: chrome.tabGroups.TabGroup =
          Number(groupId) !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ? await chrome.tabGroups.get(Number(groupId))
            : {
                title: 'Ungrouped',
                collapsed: false,
                color: 'grey',
                id: chrome.tabGroups.TAB_GROUP_ID_NONE,
                windowId: -1,
              };
        return {
          displayName: tabGroup.title ?? 'Unknown',
          tabGroup,
          tabs: tabs.map((tab) => tab.tab),
        };
      }),
    );

    return {
      type: 'tab_group',
      stats,
      results: this.sortGroups(results, filters.grouping.sortBy),
    };
  }
}
