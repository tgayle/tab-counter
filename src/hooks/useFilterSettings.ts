import { useEffect, useState } from 'react';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
  TabSortOrder,
} from '../action/TabFilter';
import settings, { FilterSettings } from '../settings';

export {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
  TabSortOrder,
} from '../action/TabFilter';

export type UseFilterSettings = FilterSettings & {
  loaded: boolean;

  setTabFilterType: (it: TabFilterType) => void;
  setTabGrouping: (it: GroupTabsByOptions) => void;
  setGroupSortBy: (it: GroupSortOrder) => void;
  setTabSortBy: (it: TabSortOrder) => void;
};

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
    const listener = ({
      groupSortBy,
      tabFilterType,
      tabGrouping,
      tabSortBy,
    }: FilterSettings) => {
      setGroupOrder(groupSortBy);
      setTabGrouping(tabGrouping);
      setTabSortOrder(tabSortBy);
      setFilterType(tabFilterType);
    };

    settings.loaded.then(() => {
      listener(settings.current);
      setLoaded(true);
    });

    settings.addListener(listener);

    return () => settings.removeListener(listener);
  }, []);

  return {
    loaded,
    groupSortBy,
    tabFilterType,
    tabGrouping,
    tabSortBy,
    setGroupSortBy: settings.setGroupSortBy,
    setTabFilterType: settings.setTabFilterType,
    setTabGrouping: settings.setTabGrouping,
    setTabSortBy: settings.setTabSortBy,
  };
}
