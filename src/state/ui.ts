import { atom } from 'jotai';
import { ActiveTab } from '../store';

export const selectedTabAtom = atom(
  ActiveTab.All,
  (get, set, tab: ActiveTab) => {
    set(selectedTabAtom, tab);
    set(expandedSectionsAtom, new Set());
  },
);

export const expandedSectionsAtom = atom<Set<string | number>>(
  new Set<string | number>(),
);

export const toggleSectionExpansion = atom(
  () => undefined,
  (get, set, id: string | number) => {
    const expandedSections = new Set(get(expandedSectionsAtom));
    if (expandedSections.has(id)) {
      expandedSections.delete(id);
    } else {
      expandedSections.add(id);
    }
    set(expandedSectionsAtom, expandedSections);
  },
);
