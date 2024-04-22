import { Tab } from '../../tabutil';
import {
  ParsedUriWithTab,
  Rule,
  TabGroupOutputResult,
  TabGroupResult,
} from './TabGrouper';
import { Filters } from '../TabFilterProcessor';
import { GroupSortOrder, TabSortOrder } from '../TabFilter';
import { TabStats } from '../TabStats';

export abstract class TabGroupingStrategy<
  Type extends string,
  Discriminator extends string | number,
  GroupDataType extends TabGroupResult,
  TabDataType extends { tab: Tab } = { tab: Tab },
> {
  abstract readonly type: Type;
  abstract getDiscriminator(tab: Tab, rule: Rule): Discriminator;
  abstract getDefaultRule(uri: ParsedUriWithTab): Rule;

  abstract groupTabs(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): {
    groupedValues: Record<Discriminator, TabDataType[]>;
    failed: Tab[];
  };

  abstract groupRules(rules: Rule[]): Record<Discriminator, Rule[]>;

  abstract buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<GroupDataType>;

  abstract groupTabsByRules(
    tabs: Tab[],
    rules: Rule[],
  ): [Map<Rule, TabDataType[]>, Tab[]];

  protected sortTabs(tabs: TabDataType[], by: TabSortOrder): TabDataType[] {
    return tabs.sort((a, b) => {
      const titleA = a.tab.title ?? a.tab.url ?? a.tab.index;
      const titleB = b.tab.title ?? b.tab.url ?? b.tab.index;
      switch (by) {
        case TabSortOrder.Asc:
          return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
        case TabSortOrder.Desc:
          return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
      }
    });
  }

  protected sortGroups<T extends TabGroupOutputResult>(
    items: T[],
    by: GroupSortOrder,
  ) {
    return items.sort((a, b) => {
      switch (by) {
        case GroupSortOrder.Count:
          if (a.tabs.length === b.tabs.length) {
            return a.displayName.localeCompare(b.displayName);
          }
          return b.tabs.length - a.tabs.length;
        case GroupSortOrder.Asc:
          return a.displayName.localeCompare(b.displayName);
        case GroupSortOrder.Desc:
          return b.displayName.localeCompare(a.displayName);
      }
    });
  }
}
