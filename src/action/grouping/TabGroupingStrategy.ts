import { Tab } from '../../tabutil';
import {
  ParsedUriWithTab,
  Rule,
  TabGroupOutputResult,
  TabGroupResult,
  sortTabs,
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
  /**
   * Returns the identifier of the relevant entity in this grouping strategy.
   *
   * Example:
   * - For `WindowGroupingStrategy`, this would be the `windowId` of a tab.
   * - For `DomainGroupingStrategy`, this would be the domain of a tab.
   */
  abstract getDiscriminator(tab: Tab, rule: Rule): Discriminator;
  /**
   * Generates a 'fallback' rule for a given tab, for situations where no
   * other rule would capture this tab.
   */
  abstract getDefaultRule(uri: ParsedUriWithTab): Rule;

  /**
   * Collects the given tabs into groups based on the strategy's discriminator.
   *
   * Tabs which cannot be grouped (e.g. invalid/missing data) should be returned
   * in the `failed` array.
   */
  abstract groupTabs(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): {
    groupedValues: Record<Discriminator, TabDataType[]>;
    failed: Tab[];
  };

  /**
   * Group the given rules by the strategy's discriminator. Primarily intended for
   * situations where some rules should only be applied to some grouping entities.
   *
   * e.g: OriginGroupingStrategy groups rules by domain, since a rule targeting
   * google.com should never interfere with a rule targeting youtube.com.
   */
  abstract groupRules(rules: Rule[]): Record<Discriminator, Rule[]>;

  abstract buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<GroupDataType>;

  /**
   * Group tabs using the given set of rules.
   *
   * Returns:
   * - [0] A map of rules to the tabs that match them.
   * - [1] Tabs which failed to be captured by any rule.
   */
  abstract groupTabsByRules(
    tabs: Tab[],
    rules: Rule[],
  ): [Map<Rule, TabDataType[]>, Tab[]];

  protected sortTabs = (tabs: TabDataType[], orderBy: TabSortOrder) =>
    sortTabs(
      tabs.map((it) => it.tab),
      orderBy,
    );

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
