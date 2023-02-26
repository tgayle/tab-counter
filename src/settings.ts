import browser from 'webextension-polyfill';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
  TabSortOrder,
} from './action/TabFilter';

enum FilterSettingsKeys {
  FILTER_TYPE = 'filter_type',
  GROUP_ORDER = 'group_order',
  TAB_GROUPING = 'tab_grouping',
  TAB_ORDER = 'tab_order',
}

export type FilterSettings = {
  tabFilterType: TabFilterType;
  tabGrouping: GroupTabsByOptions;
  groupSortBy: GroupSortOrder;
  tabSortBy: TabSortOrder;
};

export type SettingsUpdateListener = (settings: FilterSettings) => void;

class Settings {
  private loadedResolver!: () => void;
  public loaded: Promise<void> = new Promise((res) => {
    this.loadedResolver = res;
  });

  private tabFilterType: TabFilterType = TabFilterType.All;
  private tabGrouping: GroupTabsByOptions = GroupTabsByOptions.Domain;
  private groupSortBy: GroupSortOrder = GroupSortOrder.Asc;
  private tabSortBy: TabSortOrder = TabSortOrder.Asc;
  private listeners: SettingsUpdateListener[] = [];

  get current(): FilterSettings {
    return {
      groupSortBy: this.groupSortBy ?? GroupSortOrder.Asc,
      tabFilterType: this.tabFilterType ?? TabFilterType.All,
      tabGrouping: this.tabGrouping ?? GroupTabsByOptions.Domain,
      tabSortBy: this.tabSortBy ?? TabSortOrder.Asc,
    };
  }

  constructor() {
    this.loadInitial();
    this.listen();
  }

  private async loadInitial() {
    const data = await browser.storage.sync.get([
      FilterSettingsKeys.FILTER_TYPE,
      FilterSettingsKeys.GROUP_ORDER,
      FilterSettingsKeys.TAB_GROUPING,
      FilterSettingsKeys.TAB_ORDER,
    ]);

    this.tabFilterType =
      data[FilterSettingsKeys.FILTER_TYPE] ?? TabFilterType.All;
    this.groupSortBy =
      data[FilterSettingsKeys.GROUP_ORDER] ?? GroupSortOrder.Asc;
    this.tabGrouping =
      data[FilterSettingsKeys.TAB_GROUPING] ?? GroupTabsByOptions.Domain;
    this.tabSortBy = data[FilterSettingsKeys.TAB_ORDER] ?? TabSortOrder.Asc;
    this.loadedResolver();
  }

  private notifyChange() {
    const change = this.current;
    this.listeners.forEach((it) => it(change));
  }

  public addListener(it: SettingsUpdateListener) {
    this.listeners.push(it);
  }

  public removeListener(it: SettingsUpdateListener) {
    this.listeners.splice(this.listeners.indexOf(it), 1);
  }

  private listen() {
    browser.storage.onChanged.addListener((changes) => {
      let changed = false;

      if (changes[FilterSettingsKeys.FILTER_TYPE]) {
        changed = true;
        this.tabFilterType =
          changes[FilterSettingsKeys.FILTER_TYPE].newValue ?? TabFilterType.All;
      }

      if (changes[FilterSettingsKeys.GROUP_ORDER]) {
        changed = true;
        this.groupSortBy =
          changes[FilterSettingsKeys.GROUP_ORDER].newValue ??
          GroupSortOrder.Asc;
      }

      if (changes[FilterSettingsKeys.TAB_GROUPING]) {
        changed = true;
        this.tabGrouping =
          changes[FilterSettingsKeys.TAB_GROUPING].newValue ??
          GroupTabsByOptions.Domain;
      }

      if (changes[FilterSettingsKeys.TAB_ORDER]) {
        changed = true;
        this.tabSortBy =
          changes[FilterSettingsKeys.TAB_ORDER].newValue ?? TabSortOrder.Asc;
      }

      if (changed) {
        this.notifyChange();
      }
    });
  }

  setTabFilterType = (it: TabFilterType) =>
    browser.storage.sync.set({
      [FilterSettingsKeys.FILTER_TYPE]: it,
    });

  setTabGrouping = (it: GroupTabsByOptions) =>
    browser.storage.sync.set({
      [FilterSettingsKeys.TAB_GROUPING]: it,
    });

  setGroupSortBy = (it: GroupSortOrder) =>
    browser.storage.sync.set({
      [FilterSettingsKeys.GROUP_ORDER]: it,
    });

  setTabSortBy = (it: TabSortOrder) =>
    browser.storage.sync.set({
      [FilterSettingsKeys.TAB_ORDER]: it,
    });
}

export default new Settings();
