import { atom } from 'jotai';
import {
  GroupTabsByOptions,
  GroupSortOrder,
  TabFilterType,
  TabSortOrder,
} from '../action/TabFilter';
import { Filters } from '../action/TabFilterProcessor';
import settings, { SettingsUpdateListener } from '../settings';

export const tabFilterAtom = atom<Filters>({
  query: '',
  grouping: {
    groupBy: GroupTabsByOptions.Domain,
    sortBy: GroupSortOrder.Asc,
  },
  tabs: {
    type: TabFilterType.All,
    sortBy: TabSortOrder.Asc,
  },
});

let firstSettingsLoad = false;
tabFilterAtom.onMount = (setAtom) => {
  (async () => {
    if (firstSettingsLoad) {
      return;
    }

    firstSettingsLoad = true;
    await settings.loaded;
    console.log(settings.current);
    const current = settings.current;

    setAtom({
      grouping: {
        groupBy: current.tabGrouping,
        sortBy: current.groupSortBy,
      },
      query: '',
      tabs: {
        sortBy: current.tabSortBy,
        type: current.tabFilterType,
      },
    });
  })();

  const onSettingsChange: SettingsUpdateListener = (settings) =>
    setAtom({
      grouping: {
        groupBy: settings.tabGrouping,
        sortBy: settings.groupSortBy,
      },
      query: '',
      tabs: {
        sortBy: settings.tabSortBy,
        type: settings.tabFilterType,
      },
    });

  settings.addListener(onSettingsChange);
  return () => settings.removeListener(onSettingsChange);
};

export const setGroupSortByAtom = atom(
  () => {},
  async (get, set, sortBy: GroupSortOrder) => {
    await settings.setGroupSortBy(sortBy);

    set(tabFilterAtom, {
      ...get(tabFilterAtom),
      grouping: {
        ...get(tabFilterAtom).grouping,
        sortBy,
      },
    });
  },
);

export const setTabFilterTypeAtom = atom(
  () => {},
  async (get, set, type: TabFilterType) => {
    await settings.setTabFilterType(type);

    set(tabFilterAtom, {
      ...get(tabFilterAtom),
      tabs: {
        ...get(tabFilterAtom).tabs,
        type,
      },
    });
  },
);

export const setTabGroupingAtom = atom(
  () => {},
  async (get, set, groupBy: GroupTabsByOptions) => {
    await settings.setTabGrouping(groupBy);

    set(tabFilterAtom, {
      ...get(tabFilterAtom),
      grouping: {
        ...get(tabFilterAtom).grouping,
        groupBy,
      },
    });
  },
);
