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
import { BrowserWindow, getCurrentWindow, getTabInfo, Tab } from './tabutil';

enum ActiveTab {
  All,
  Normal,
  Incog,
}

type TabCounterState = {
  state: {
    currentWindow: BrowserWindow | null;
    allTabs: Tab[];
    normalTabs: Tab[];
    incognitoTabs: Tab[];
    query: Filters;
    groups: GroupedTabType;
    activeTab: ActiveTab;

    setActiveTab: (tab: ActiveTab) => void;
    setSearchQuery: (query: string) => void;
    setTabFilterType(type: TabFilterType): void;
    setGroupSortBy(by: GroupSortOrder): void;
    setTabGrouping(grouping: GroupTabsByOptions): void;
  };

  ui: {
    searchVisible: boolean;
    focusedTabMenu: number | null;
    setFocusedTab(tab: Tab | null): void;
    expandedSections: number[];

    toggleSearchVisible: () => void;
    setSearchVisible: (visible: boolean) => void;
    toggleSection(indices: number[]): void;
  };
};

export const useStore = create<TabCounterState>((set, getState) => {
  const refresh = async () => {
    const {
      state: { allTabs, incognitoTabs, normalTabs, activeTab },
    } = getState();
    const targetTabs =
      activeTab === ActiveTab.All
        ? allTabs
        : activeTab === ActiveTab.Normal
        ? normalTabs
        : incognitoTabs;

    const groups = await TabFilterProcessor.viaIpc.execute({
      filters: getState().state.query,
      targetTabs,
    });

    set(({ state }) => ({ state: { ...state, groups } }));
  };

  (async () => {
    await settings.loaded;
    const currentWindow = await getCurrentWindow();
    const { groupSortBy, tabFilterType, tabGrouping, tabSortBy } =
      settings.current;

    set(({ state }) => ({
      state: {
        ...state,
        currentWindow,
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
      },
    }));

    settings.addListener((settings) => {
      set(({ state }) => ({
        state: {
          ...state,
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
        },
      }));
      refresh();
    });

    const updateTabs = async () => {
      const { tabs: currentTabs } = await getTabInfo();
      set(({ state }) => ({
        state: {
          ...state,
          normalTabs: currentTabs.normal,
          allTabs: currentTabs.all,
          incognitoTabs: currentTabs.incognito,
          activeTab:
            state.activeTab === ActiveTab.Incog && !currentTabs.incognito.length
              ? ActiveTab.All
              : state.activeTab === ActiveTab.Normal &&
                !currentTabs.normal.length
              ? ActiveTab.All
              : state.activeTab,
        },
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
    state: {
      currentWindow: null,
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
      setSearchQuery: (query) => {
        set(({ state }) => ({
          state: { ...state, query: { ...state.query, query: query } },
        }));
        refresh();
      },
      setTabGrouping: async (grouping) => {
        await settings.setTabGrouping(grouping);
        return set(({ state }) => ({
          state: {
            ...state,
            query: {
              ...state.query,
              grouping: {
                ...state.query.grouping,
                groupBy: grouping,
              },
            },
          },
        }));
      },
      setGroupSortBy: async (by) => {
        await settings.setGroupSortBy(by);
        return set(({ state }) => ({
          state: {
            ...state,
            query: {
              ...state.query,
              grouping: {
                ...state.query.grouping,
                sortBy: by,
              },
            },
          },
        }));
      },
      groups: { allTabs: [], filteredTabs: [], grouping: 'domain' },
      async setTabFilterType(newFilter) {
        await settings.setTabFilterType(newFilter);
        set(({ state }) => ({
          state: {
            ...state,
            query: {
              ...state.query,
              tabs: {
                ...state.query.tabs,
                type: newFilter,
              },
            },
          },
        }));

        refresh();
      },
      setActiveTab(tab) {
        set(({ state, ui }) => ({
          state: {
            ...state,
            activeTab: tab,
          },
          ui: {
            ...ui,
            expandedSections: [],
          },
        }));
      },
    },
    ui: {
      focusedTabMenu: null,
      setFocusedTab: (tab) =>
        set(({ ui }) => ({ ui: { ...ui, focusedTabMenu: tab?.id ?? null } })),
      expandedSections: [],
      toggleSection: (indices) =>
        set(({ ui }) => {
          return {
            ui: {
              ...ui,
              expandedSections: indices,
            },
          };
        }),
      searchVisible: false,
      setSearchVisible: (visible) =>
        set(({ state, ui }) => ({
          state: {
            ...state,
            query: { ...state.query, query: '' },
          },
          ui: {
            ...ui,
            searchVisible: visible,
          },
        })),
      toggleSearchVisible: () =>
        set(({ ui }) => ({ ui: { ...ui, searchVisible: !ui.searchVisible } })),
    },
  };
});
