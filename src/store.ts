import create, { StateCreator } from 'zustand';
import { defaultRules } from './action/grouping/defaultRules';
import { Rule, TabGrouper, TabGroupResult } from './action/grouping/TabGrouper';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from './action/TabFilter';
import { Filters } from './action/TabFilterProcessor';
import { TabStats } from './action/TabStats';
import settings from './settings';
import { BrowserWindow, getCurrentWindow, getTabInfo, Tab } from './tabutil';

export enum ActiveTab {
  All,
  Normal,
  Incog,
  Settings,
}

type UiSlice = {
  ui: {
    searchVisible: boolean;
    expandedSections: Set<string | number>;
    toggleSearchVisible: () => void;
    setSearchVisible: (visible: boolean) => void;
    toggleSection(index: string | number): void;
  };
};

type StateSlice = {
  state: {
    currentWindow: BrowserWindow | null;
    allTabs: Tab[];
    normalTabs: Tab[];
    incognitoTabs: Tab[];
    query: Filters;
    groups: TabGroupResult;
    activeTab: ActiveTab;
    stats: TabStats;
    rules: Rule[];

    restoreDefaultRules: () => void;
    addRule: (rule: Rule) => void;
    removeRule: (rule: Rule) => void;
    updateRule: (rule: Rule) => void;
    setActiveTab: (tab: ActiveTab) => void;
    setSearchQuery: (query: string) => void;
    setTabFilterType(type: TabFilterType): void;
    setGroupSortBy(by: GroupSortOrder): void;
    setTabGrouping(grouping: GroupTabsByOptions): void;
  };
};

type TabCounterState = StateSlice & UiSlice;

const createUiSlice: StateCreator<TabCounterState, [], [], UiSlice> = (
  set,
) => ({
  ui: {
    expandedSections: new Set(),
    toggleSection: (id: string | number) =>
      set(({ ui }) => {
        const expandedSections = new Set(ui.expandedSections);
        if (expandedSections.has(id)) {
          expandedSections.delete(id);
        } else {
          expandedSections.add(id);
        }
        return {
          ui: {
            ...ui,
            expandedSections: expandedSections,
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
});

const createStateSlice: StateCreator<TabCounterState, [], [], StateSlice> = (
  set,
  getState,
) => {
  const refresh = async () => {
    const {
      state: {
        allTabs,
        incognitoTabs,
        normalTabs,
        activeTab,
        currentWindow,
        query: filters,
      },
    } = getState();
    const targetTabs =
      activeTab === ActiveTab.All
        ? allTabs
        : activeTab === ActiveTab.Normal
        ? normalTabs
        : incognitoTabs;

    grouper.windowId = currentWindow?.id ?? -1;

    const groups =
      filters.grouping.groupBy === GroupTabsByOptions.Domain
        ? grouper.filterByRules(targetTabs, filters)
        : await grouper.filterByWindows(targetTabs, filters);
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
      rules: grouper.activeRules,
      restoreDefaultRules() {
        set(({ state }) => ({ state: { ...state, rules: defaultRules } }));
        localStorage.setItem('rules', JSON.stringify(defaultRules));
        refresh();
      },
      addRule: (rule) => {
        const newRules = [rule, ...getState().state.rules];
        set(({ state }) => ({ state: { ...state, rules: newRules } }));
        localStorage.setItem('rules', JSON.stringify(newRules));
        refresh();
      },
      removeRule: (rule) => {
        const newRules = getState().state.rules.filter((r) => r.id !== rule.id);
        localStorage.setItem('rules', JSON.stringify(newRules));
        set(({ state }) => ({ state: { ...state, rules: newRules } }));
        refresh();
      },
      updateRule: (rule) => {
        const rules = getState().state.rules.slice();
        rules.splice(
          rules.findIndex((r) => r.id === rule.id),
          1,
          rule,
        );
        localStorage.setItem('rules', JSON.stringify(rules));
        set(({ state }) => ({ state: { ...state, rules: rules } }));
        refresh();
      },
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
      stats: {
        audible: [],
        duplicates: [],
        muted: [],
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
      groups: {
        results: [],
        stats: { audible: [], duplicates: [], muted: [] },
        type: 'window',
      },
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
            expandedSections: new Set(),
          },
        }));
        refresh();
      },
    },
  };
};

const grouper = new TabGrouper();

export const useStore = create<TabCounterState>((...a) => ({
  ...createUiSlice(...a),
  ...createStateSlice(...a),
}));
