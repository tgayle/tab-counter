import { GroupedTabType } from '../hooks/useFilteredTabs';
import { Tab } from '../tabutil';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
  filterTabs,
  sortDomains,
  groupTabsByDomain,
  sortWindows,
  groupTabsByWindow,
} from './TabFilter';

type Filters = {
  query: string;
  tabs: {
    type: TabFilterType;
    sortBy: TabSortOrder;
  };
  grouping: {
    groupBy: GroupTabsByOptions;
    sortBy: GroupSortOrder;
  };
};

export type TabUpdateListener = (results: GroupedTabType) => void;
type SortGroupFn = (filters: Filters, tabs: Tab[]) => Promise<GroupedTabType>;

export class TabFilterProcessor {
  private _tabs: Tab[] = [];
  private listeners: TabUpdateListener[] = [];
  private _dirty = true;
  private _loading = false;
  private _result: GroupedTabType | null = null;
  private _filters: Filters = {
    grouping: {
      groupBy: GroupTabsByOptions.Domain,
      sortBy: GroupSortOrder.Asc,
    },
    query: '',
    tabs: {
      sortBy: TabSortOrder.Asc,
      type: TabFilterType.All,
    },
  };

  set filters(filters: Filters) {
    this._filters = filters;
    this._dirty = true;
  }
  get results() {
    return this._result;
  }

  get filters() {
    return this._filters;
  }

  get dirty() {
    return this._dirty;
  }

  get loading() {
    return this._loading;
  }

  set tabs(tabs: Tab[]) {
    this._tabs = tabs;
    this._dirty = true;
  }

  constructor(initialFilters: Filters) {
    this._filters = initialFilters;
  }

  public async update() {
    if (this.loading) return;
    this._loading = true;
    const filters = this._filters;
    const tabs = this._tabs;

    const filteredTabs = await profile('Filter Tabs', async () =>
      filterTabs(filters.tabs.type, tabs, filters.query),
    );

    switch (filters.grouping.groupBy) {
      case GroupTabsByOptions.Domain: {
        this._result = await profile('Group By Domain', () =>
          this.sortAndGroupByDomain(filters, filteredTabs),
        );
        break;
      }
      case GroupTabsByOptions.Window: {
        this._result = await profile('Group By Window', () =>
          this.sortAndGroupByWindow(filters, filteredTabs),
        );
        break;
      }
      default: {
        throw new Error(
          `Unhandled group by option: ${filters.grouping.groupBy}`,
        );
      }
    }

    this._dirty = false;
    this._loading = false;
    const r = this._result;
    profile('Notify Listener', () => this.onUpdatedTabs(r));
    return this._result!;
  }

  private onUpdatedTabs(result: GroupedTabType) {
    this.listeners.forEach((it) => it(result));
  }

  public addListener(listener: TabUpdateListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: TabUpdateListener) {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  }

  private sortAndGroupByDomain: SortGroupFn = async (filters, tabs) => {
    return {
      allTabs: tabs,
      filteredTabs: sortDomains(
        filters.grouping.sortBy,
        filters.tabs.sortBy,
        groupTabsByDomain(tabs),
      ),
      grouping: 'domain',
    };
  };

  private sortAndGroupByWindow: SortGroupFn = async (filters, tabs) => {
    return {
      allTabs: tabs,
      filteredTabs: sortWindows(
        filters.grouping.sortBy,
        filters.tabs.sortBy,
        await groupTabsByWindow(tabs),
      ),
      grouping: 'window',
    };
  };
}

export function profile<T = void>(name: string, action: () => T): T {
  const start = performance.now();
  const r = action();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
  return r;
}

export function profiler(name: string) {
  const start = performance.now();

  return {
    done: () => {
      const end = performance.now();
      console.log(`${name} took ${end - start}ms`);
    },
  };
}
