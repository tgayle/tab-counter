import { useEffect, useState } from 'react';

export enum TabFilterType {
  Audible = 'audible',
  All = 'all',
  CurrentWindow = 'currentWindow',
}

export enum GroupSortOrder {
  Count = 'count',
  Asc = 'asc',
  Desc = 'desc',
}

export enum GroupTabsByOptions {
  Domain = 'domain',
  Window = 'window',
}

export enum TabSortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export type FilterSettings = {
  tabFilterType: TabFilterType;
  tabGrouping: GroupTabsByOptions;
  groupSortBy: GroupSortOrder;
  tabSortBy: TabSortOrder;
};

export type UseFilterSettings = FilterSettings & {
  loaded: boolean;

  setTabFilterType: (it: TabFilterType) => void;
  setTabGrouping: (it: GroupTabsByOptions) => void;
  setGroupSortBy: (it: GroupSortOrder) => void;
  setTabSortBy: (it: TabSortOrder) => void;
};

enum FilterSettingsKeys {
  FILTER_TYPE = 'filter_type',
  GROUP_ORDER = 'group_order',
  TAB_GROUPING = 'tab_grouping',
  TAB_ORDER = 'tab_order',
}

export function useFilterSettings(): UseFilterSettings {
  const [loaded, setLoaded] = useState(false);
  const [tabFilterType, setFilterType] = useState<TabFilterType>(
    TabFilterType.All,
  );
  const [groupSortBy, setGroupOrder] = useState<GroupSortOrder>(
    GroupSortOrder.Asc,
  );
  const [tabGrouping, setTabGrouping] = useState<GroupTabsByOptions>(
    GroupTabsByOptions.Domain,
  );
  const [tabSortBy, setTabSortOrder] = useState<TabSortOrder>(TabSortOrder.Asc);

  useEffect(() => {
    (async () => {
      const data = await chrome.storage.sync.get([
        FilterSettingsKeys.FILTER_TYPE,
        FilterSettingsKeys.GROUP_ORDER,
        FilterSettingsKeys.TAB_GROUPING,
        FilterSettingsKeys.TAB_ORDER,
      ]);

      setFilterType(data[FilterSettingsKeys.FILTER_TYPE] ?? TabFilterType.All);
      setGroupOrder(data[FilterSettingsKeys.GROUP_ORDER] ?? GroupSortOrder.Asc);
      setTabGrouping(
        data[FilterSettingsKeys.TAB_GROUPING] ?? GroupTabsByOptions.Domain,
      );
      setTabSortOrder(data[FilterSettingsKeys.TAB_ORDER] ?? TabSortOrder.Asc);
      setLoaded(true);
    })();

    const changeHandler = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if (changes[FilterSettingsKeys.FILTER_TYPE]) {
        setFilterType(
          changes[FilterSettingsKeys.FILTER_TYPE].newValue ?? TabFilterType.All,
        );
      }

      if (changes[FilterSettingsKeys.GROUP_ORDER]) {
        setGroupOrder(
          changes[FilterSettingsKeys.GROUP_ORDER].newValue ??
            GroupSortOrder.Asc,
        );
      }

      if (changes[FilterSettingsKeys.TAB_GROUPING]) {
        setTabGrouping(
          changes[FilterSettingsKeys.TAB_GROUPING].newValue ??
            GroupTabsByOptions.Domain,
        );
      }

      if (changes[FilterSettingsKeys.TAB_ORDER]) {
        setTabSortOrder(
          changes[FilterSettingsKeys.TAB_ORDER].newValue ?? TabSortOrder.Asc,
        );
      }
    };

    chrome.storage.onChanged.addListener(changeHandler);

    return () => chrome.storage.onChanged.removeListener(changeHandler);
  }, []);

  return {
    loaded,
    groupSortBy,
    tabFilterType,
    tabGrouping,
    tabSortBy,
    setTabFilterType: (it) =>
      chrome.storage.sync.set({
        [FilterSettingsKeys.FILTER_TYPE]: it,
      }),
    setTabGrouping: (it) =>
      chrome.storage.sync.set({
        [FilterSettingsKeys.TAB_GROUPING]: it,
      }),
    setGroupSortBy: (it) =>
      chrome.storage.sync.set({
        [FilterSettingsKeys.GROUP_ORDER]: it,
      }),
    setTabSortBy: (it) =>
      chrome.storage.sync.set({
        [FilterSettingsKeys.TAB_ORDER]: it,
      }),
  };
}
