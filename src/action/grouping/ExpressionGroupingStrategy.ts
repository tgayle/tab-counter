import { Tab } from '../../tabutil';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import {
  ExpressionGroupedOutput,
  ParsedUriWithTab,
  ExpressionGroupedOutputResult,
  Rule,
} from './TabGrouper';
import { TabGroupingStrategy } from './TabGroupingStrategy';

export class ExpressionGroupingStrategy extends TabGroupingStrategy<
  'expression',
  string,
  ExpressionGroupedOutput
> {
  readonly type = 'expression';
  getDiscriminator(tab: Tab, rule: Rule) {
    return rule.titleRegex ?? '.+';
  }

  getDefaultRule(uri: ParsedUriWithTab): Rule {
    return {
      displayName: uri.tab.title ?? uri.tab.url ?? 'Unknown Tab',
      id: `default_${uri.tab.id}`,
      origin: 'expression',
      pathname: null,
      queryParams: [],
      titleRegex: uri.tab.title ?? uri.tab.url ?? '',
    };
  }

  groupTabs(tabs: Tab[], rules: Rule[]) {
    const groupedValues: Record<string, { tab: Tab }[]> = {};
    const failed: Tab[] = [];
    for (const tab of tabs) {
      const matchingRule = rules.find((rule) => {
        const match = tab.title?.match(rule.titleRegex ?? '');
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
      if (!groupedRules[rule.titleRegex ?? '']) {
        groupedRules[rule.titleRegex ?? ''] = [];
      }
      groupedRules[rule.titleRegex ?? ''].push(rule);
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
      const expressionRule = rules.find(
        (rule) => rule.titleRegex === expression,
      );
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
        displayName: rule.displayName ?? rule.titleRegex ?? rule.origin,
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
