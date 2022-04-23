import { useState, useEffect } from 'react';
import { TabFilterProcessor } from '../action/TabFilterProcessor';
import { Tab, BrowserWindow } from '../tabutil';
import { useFilterSettings, FilterSettings } from './useFilterSettings';

type GroupedTab = {
  allTabs: Tab[];
};

export type GroupedTabType = DomainGroupedTabs | WindowGroupedTabs;

type DomainGroupedTabs = GroupedTab & {
  grouping: 'domain';
  filteredTabs: { domain: string; tabs: Tab[] }[];
};

type WindowGroupedTabs = GroupedTab & {
  grouping: 'window';
  filteredTabs: { window: BrowserWindow; tabs: Tab[] }[];
};

type UseFilteredTabs = {
  loading: boolean;
  type: GroupedTabType['grouping'];
  groupedTabs: GroupedTabType;
  sortOptions: FilterSettings;
};

export function useFilteredTabs(
  tabs: Tab[],
  searchQuery: string = '',
): UseFilteredTabs {
  const [loading, setLoading] = useState(true);
  const [groupedTabs, setGroupedTabs] = useState<GroupedTabType>({
    filteredTabs: [],
    grouping: 'domain',
    allTabs: [],
  });

  const sortOptions = useFilterSettings();

  useEffect(() => {
    const { groupSortBy, loaded, tabFilterType, tabGrouping, tabSortBy } =
      sortOptions;

    if (!loaded) {
      return;
    }

    (async () => {
      setLoading(true);
      if (await TabFilterProcessor.viaIpc.isLoading()) {
        return;
      }
      await TabFilterProcessor.viaIpc.setFilters({
        grouping: {
          sortBy: groupSortBy,
          groupBy: tabGrouping,
        },
        query: searchQuery,
        tabs: {
          sortBy: tabSortBy,
          type: tabFilterType,
        },
      });

      await TabFilterProcessor.viaIpc.setTabs(tabs);
      const res = await TabFilterProcessor.viaIpc.submit();
      console.log('received result', res);
      setGroupedTabs(res);
      setLoading(false);
    })();
  }, [
    searchQuery,
    sortOptions.loaded,
    sortOptions.groupSortBy,
    sortOptions.tabFilterType,
    sortOptions.tabGrouping,
    sortOptions.tabSortBy,
    tabs,
  ]);

  return {
    loading,
    groupedTabs,
    sortOptions,
    type: sortOptions.tabGrouping,
  };
}
