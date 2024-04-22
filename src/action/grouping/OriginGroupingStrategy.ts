import { Tab, partition } from '../../tabutil';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import {
  DomainGroupedOutput,
  ParsedUriWithTab,
  tabToUri,
  DomainGroupedOutputResult,
  isRuleApplicableToTab,
  Rule,
} from './TabGrouper';
import { TabGroupingStrategy } from './TabGroupingStrategy';

export class OriginGroupingStrategy extends TabGroupingStrategy<
  'origin',
  string,
  DomainGroupedOutput
> {
  readonly type = 'origin';
  getDiscriminator(tab: Tab, rule: Rule) {
    return rule.origin;
  }

  groupTabs(tabs: Tab[]) {
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

    return {
      groupedValues: tabsByOrigin,
      failed: invalidTabs,
    };
  }

  groupRules(rules: Rule[]) {
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

  async buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<DomainGroupedOutput> {
    const [tabsByRule, unparsableTabs] = this.groupTabsByRules(tabs, rules);

    const groups = [...tabsByRule.entries()].map(
      ([rule, tabs]): DomainGroupedOutputResult => {
        return {
          rule,
          displayName: rule.displayName ?? rule.origin,
          origin: rule.origin,
          tabs: this.sortTabs(tabs, filters.tabs.sortBy).map((it) => it.tab),
        };
      },
    );

    const results = [
      ...this.sortGroups(groups, filters.grouping.sortBy),
      {
        displayName: 'Unknown',
        origin: 'unknown',
        rule: null,
        tabs: unparsableTabs,
      } as DomainGroupedOutputResult,
    ].filter((it) => it.tabs.length);
    return {
      type: 'domain',
      stats,
      results,
    };
  }

  groupTabsByRules(
    tabs: Tab[],
    rules: Rule[],
  ): [Map<Rule, { tab: Tab }[]>, Tab[]] {
    const rulesByOrigin = this.groupRules(rules);
    const { groupedValues: tabsByOrigin, failed: unparsableTabs } =
      this.groupTabs(tabs);
    const tabsWithAssociatedRule: [tab: ParsedUriWithTab, ruleUsed: Rule][] =
      [];

    for (const origin in tabsByOrigin) {
      // Create a catch-all rule for each origin
      {
        const originRules = rulesByOrigin[origin] ?? [];
        originRules.push(this.getDefaultRule(tabsByOrigin[origin][0]));
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

    const ruleToTab = new Map<Rule, { tab: Tab }[]>();
    for (const [tab, rule] of tabsWithAssociatedRule) {
      const tabs = ruleToTab.get(rule) ?? [];
      tabs.push({ tab: tab.tab });
      ruleToTab.set(rule, tabs);
    }

    return [ruleToTab, unparsableTabs];
  }

  getDefaultRule({ origin }: ParsedUriWithTab): Rule {
    return {
      origin: origin,
      id: `default_${origin}`,
      pathname: null,
      queryParams: [],
      displayName: origin.startsWith('https://') ? origin.slice(8) : origin,
    };
  }
}
