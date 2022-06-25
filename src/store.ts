import create from 'zustand';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from './action/TabFilter';
import { Filters, TabFilterProcessor } from './action/TabFilterProcessor';
import { GroupedTabType } from './hooks/useFilteredTabs';
import settings from './settings';
import { getTabInfo, Tab } from './tabutil';

enum ActiveTab {
  All,
  Normal,
  Incog,
}

type TabCounterState = {
  allTabs: Tab[];
  normalTabs: Tab[];
  incognitoTabs: Tab[];
  activeTab: ActiveTab;
  query: Filters;
  searchVisible: boolean;
  toggleSearchVisible: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSearchQuery: (query: string) => void;
  setSearchVisible: (visible: boolean) => void;
  groups: GroupedTabType;

  expandedSections: number[];
  toggleSection(indices: number[]): void;
  setTabFilterType(type: TabFilterType): void;
  setGroupSortBy(by: GroupSortOrder): void;
  setTabGrouping(grouping: GroupTabsByOptions): void;

  focusedTabMenu: Tab | null;
  setFocusedTab(tab: Tab | null): void;
};

export const useStore = create<TabCounterState>((set, getState) => {
  const refresh = async () => {
    const { allTabs, incognitoTabs, normalTabs, activeTab } = getState();
    const targetTabs =
      activeTab === ActiveTab.All
        ? allTabs
        : activeTab === ActiveTab.Normal
        ? normalTabs
        : incognitoTabs;

    const res = await TabFilterProcessor.viaIpc.execute({
      filters: getState().query,
      targetTabs,
    });

    set(() => ({ groups: res }));
  };

  (async () => {
    await settings.loaded;
    const { groupSortBy, tabFilterType, tabGrouping, tabSortBy } =
      settings.current;

    set(() => ({
      query: {
        query: '',
        grouping: {
          groupBy: tabGrouping,
          sortBy: groupSortBy,
        },
        tabs: {
          sortBy: tabSortBy,
          type: tabFilterType,
        },
      },
    }));

    settings.addListener((settings) => {
      set((state) => ({
        query: {
          ...state.query,
          grouping: {
            groupBy: settings.tabGrouping,
            sortBy: settings.groupSortBy,
          },
          tabs: {
            sortBy: settings.tabSortBy,
            type: settings.tabFilterType,
          },
        },
      }));
      refresh();
    });

    const updateTabs = async () => {
      const { tabs: currentTabs } = await getTabInfo();
      set((state) => ({
        normalTabs: currentTabs.normal,
        allTabs: currentTabs.all,
        incognitoTabs: currentTabs.incognito,
        activeTab:
          state.activeTab === ActiveTab.Incog && !currentTabs.incognito.length
            ? ActiveTab.All
            : state.activeTab === ActiveTab.Normal && !currentTabs.normal.length
            ? ActiveTab.All
            : state.activeTab,
      }));
      refresh();
    };

    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);
    await updateTabs();
    refresh();
  })();

  return {
    query: {
      query: '',
      grouping: {
        groupBy: GroupTabsByOptions.Domain,
        sortBy: GroupSortOrder.Asc,
      },
      tabs: {
        type: TabFilterType.All,
        sortBy: TabSortOrder.Asc,
      },
    },
    allTabs: [],
    activeTab: ActiveTab.All,
    incognitoTabs: [],
    normalTabs: [],
    searchVisible: false,
    setSearchVisible: (visible) =>
      set((state) => ({
        searchVisible: visible,
        query: { ...state.query, query: '' },
      })),
    toggleSearchVisible: () =>
      set((state) => ({ searchVisible: !state.searchVisible })),
    setActiveTab(tab) {
      set(() => ({
        activeTab: tab,
        expandedSections: [],
      }));
    },
    setSearchQuery: (query) => {
      set((state) => ({ query: { ...state.query, query: query } }));
      refresh();
    },
    expandedSections: [],
    toggleSection: (indices) =>
      set(() => {
        return {
          expandedSections: indices,
        };
      }),
    groups: { allTabs: [], filteredTabs: [], grouping: 'domain' },
    async setTabFilterType(newFilter) {
      await settings.setTabFilterType(newFilter);
      set((state) => {
        return {
          query: {
            ...state.query,
            tabs: {
              ...state.query.tabs,
              type: newFilter,
            },
          },
        };
      });

      refresh();
    },
    focusedTabMenu: null,
    setFocusedTab: (tab) => set(() => ({ focusedTabMenu: tab })),
    setTabGrouping: async (grouping) => {
      await settings.setTabGrouping(grouping);
      return set((state) => ({
        query: {
          ...state.query,
          grouping: {
            ...state.query.grouping,
            groupBy: grouping,
          },
        },
      }));
    },
    setGroupSortBy: async (by) => {
      await settings.setGroupSortBy(by);
      return set((state) => ({
        query: {
          ...state.query,
          grouping: {
            ...state.query.grouping,
            sortBy: by,
          },
        },
      }));
    },
  };
});
