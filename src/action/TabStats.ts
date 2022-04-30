import { Tab } from '../tabutil';
import {
  groupAndFilterDuplicateTabs,
  DuplicatePolicy,
} from './duplication/tabDeduplication';

export type TabStats = {
  audible: Tab[];
  duplicates: Tab[];
  muted: Tab[];
};

export function getTabsStats(tabs: Tab[]): TabStats {
  const audible: Tab[] = [];
  const muted: Tab[] = [];

  for (const tab of tabs) {
    if (tab.audible) {
      audible.push(tab);
    }

    if (tab.mutedInfo?.muted) {
      muted.push(tab);
    }
  }

  const duplicates = groupAndFilterDuplicateTabs(tabs, DuplicatePolicy.Presets);

  return {
    audible,
    muted,
    duplicates,
  };
}
