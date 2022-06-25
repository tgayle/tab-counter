import { Tab, BrowserWindow } from '../tabutil';

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
