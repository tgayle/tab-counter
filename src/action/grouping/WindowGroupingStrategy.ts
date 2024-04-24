import { BrowserWindow, Tab, getAllWindows } from '../../tabutil';
import { Filters } from '../TabFilterProcessor';
import { TabStats } from '../TabStats';
import { ParsedUriWithTab, Rule } from './TabGrouper';
import { TabGroupingStrategy } from './TabGroupingStrategy';

export type WindowGroupedOutputResult = {
  displayName: string;
  window: BrowserWindow;
  tabs: Tab[];
};

export type WindowGroupedOutput = {
  type: 'window';
  stats: TabStats;
  results: WindowGroupedOutputResult[];
};

export class WindowGroupingStrategy extends TabGroupingStrategy<
  'window',
  number,
  WindowGroupedOutput
> {
  readonly type = 'window';
  getDiscriminator(tab: Tab) {
    return tab.windowId ?? -1;
  }

  groupTabs(tabs: Tab[]) {
    const groupedValues = tabs.reduce((acc, tab) => {
      tab.windowId ??= -1;
      const tabs = acc[tab.windowId] || [];
      tabs.push({ tab });
      acc[tab.windowId] = tabs;
      return acc;
    }, {} as Record<number, { tab: Tab }[]>);

    return {
      groupedValues,
      failed: [],
    };
  }

  groupRules(): Record<number, Rule[]> {
    // Rules don't really apply to windows.
    return {};
  }

  groupTabsByRules(): [Map<Rule, { tab: Tab }[]>, Tab[]] {
    return [new Map(), []];
  }

  getDefaultRule(uri: ParsedUriWithTab): Rule {
    return {
      displayName: `Window ${uri.tab.windowId}`,
      id: `default_${uri.tab.windowId}`,
      origin: 'window',
      pathname: null,
      queryParams: [],
    };
  }

  async buildResult(
    tabs: Tab[],
    rules: Rule[],
    filters: Filters,
    stats: TabStats,
  ): Promise<WindowGroupedOutput> {
    const windows = await getAllWindows();

    const { groupedValues: tabsByWindow } = this.groupTabs(tabs);

    const groups = windows
      .map((window): WindowGroupedOutputResult => {
        return {
          window,
          displayName: `Window ${window.id}`,
          tabs: this.sortTabs(
            tabsByWindow[window.id!] || [],
            filters.tabs.sortBy,
          ),
        };
      })
      .filter((it) => it.tabs.length);

    return {
      type: 'window',
      stats,
      results: groups,
    };
  }
}
