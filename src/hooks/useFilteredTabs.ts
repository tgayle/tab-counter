import { useState, useEffect } from 'react';
import { TabFilterProcessor } from '../action/TabFilterProcessor';
import { FilterSettings } from '../settings';
import { Tab, BrowserWindow } from '../tabutil';
import { useFilterSettings } from './useFilterSettings';

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
    (async () => {
      setLoading(true);
      await TabFilterProcessor.viaIpc.setFilters({
        query: searchQuery,
        grouping: {
          groupBy: sortOptions.tabGrouping,
          sortBy: sortOptions.groupSortBy,
        },
        tabs: {
          sortBy: sortOptions.tabSortBy,
          type: sortOptions.tabFilterType,
        },
      });
      await TabFilterProcessor.viaIpc.setTabs(tabs);
      const res = await TabFilterProcessor.viaIpc.submit();
      console.log('received result', res);
      setGroupedTabs(res);
      setLoading(false);
    })();
  }, [searchQuery, tabs, ...sortOptions.dependencyArray]);

  return {
    loading,
    groupedTabs,
    sortOptions,
    type: sortOptions.tabGrouping,
  };
}
