import { Tab } from '../../tabutil';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import { ParsedUriWithTab, Rule } from './TabGrouper';
import { TabGroupingStrategy } from './TabGroupingStrategy';

export type ExpressionGroupedOutput = {
  type: 'expression';
  stats: TabStats;
  results: ExpressionGroupedOutputResult[];
};

export type ExpressionGroupedOutputResult = {
  displayName: string;
  rule: Rule;
  tabs: Tab[];
};

export class ExpressionGroupingStrategy extends TabGroupingStrategy<
  'expression',
  string,
  ExpressionGroupedOutput
> {
  readonly type = 'expression';
  getDiscriminator(tab: Tab, rule: Rule) {
    return rule.regex ?? '.+';
  }

  getDefaultRule(uri: ParsedUriWithTab): Rule {
    return {
      displayName: uri.tab.title ?? uri.tab.url ?? 'Unknown Tab',
      id: `default_${uri.tab.id}`,
      origin: 'expression',
      pathname: null,
      queryParams: [],
      regex: uri.tab.title ?? uri.tab.url ?? '',
    };
  }

  groupTabs(tabs: Tab[], rules: Rule[]) {
    const groupedValues: Record<string, { tab: Tab }[]> = {};
    const failed: Tab[] = [];

    for (const tab of tabs) {
      const matchingRule = rules.find((rule) => {
        if (!rule.regex) {
          return false;
        }

        const match =
          tab.title?.match(rule.regex) ??
          tab.url?.match(new RegExp(rule.regex, 'i'));
        return match && match.length > 0;
      });

      if (!matchingRule) {
        failed.push(tab);
        continue;
      }

      const discriminator = this.getDiscriminator(tab, matchingRule);
      if (!groupedValues[discriminator]) {
        groupedValues[discriminator] = [];
      }
      groupedValues[discriminator].push({ tab });
    }

    return { groupedValues, failed };
  }

  groupRules(rules: Rule[]): Record<string, Rule[]> {
    const groupedRules: Record<string, Rule[]> = {};
    for (const rule of rules) {
      if (!groupedRules[rule.regex ?? '']) {
        groupedRules[rule.regex ?? ''] = [];
      }
      groupedRules[rule.regex ?? ''].push(rule);
    }
    return groupedRules;
  }

  groupTabsByRules(
    tabs: Tab[],
    rules: Rule[],
  ): [Map<Rule, { tab: Tab }[]>, Tab[]] {
    const { groupedValues: tabsByExpression } = this.groupTabs(tabs, rules);

    const ruleToTab = new Map<Rule, { tab: Tab }[]>();
    for (const expression in tabsByExpression) {
      const expressionTabs = tabsByExpression[expression];
      const expressionRule = rules.find((rule) => rule.regex === expression);
      if (expressionRule) {
        ruleToTab.set(expressionRule, expressionTabs);
      }
    }

    return [ruleToTab, []];
  }

  async buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<ExpressionGroupedOutput> {
    const [tabsByRules] = this.groupTabsByRules(tabs, rules);

    const results: ExpressionGroupedOutputResult[] = [
      ...tabsByRules.entries(),
    ].map(([rule, tabs]) => {
      return {
        displayName: rule.displayName ?? rule.regex ?? rule.origin,
        rule,
        tabs: tabs.map((it) => it.tab),
      };
    });

    return {
      type: 'expression',
      results: this.sortGroups(results, filters.grouping.sortBy),
      stats,
    };
  }
}
