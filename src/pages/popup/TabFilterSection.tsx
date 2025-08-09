import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { ReactNode } from 'react';
import { MdSearch, MdSort } from 'react-icons/md';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
} from '../../action/TabFilter';
import {
  setGroupSortByAtom,
  setTabFilterTypeAtom,
  setTabGroupingAtom,
  tabFilterAtom,
} from '../../state/settings';
import { filteredTabGroups, searchVisibleAtom } from '../../state/tabs';
import Features from '../../Features';

export function TabFilterSection() {
  const [searchVisible, toggleSearchVisible] = useAtom(searchVisibleAtom);
  const filters = useAtomValue(tabFilterAtom);
  const setTabFilterType = useSetAtom(setTabFilterTypeAtom);
  const setTabGrouping = useSetAtom(setTabGroupingAtom);
  const setGroupSortBy = useSetAtom(setGroupSortByAtom);

  return (
    <div className="flex gap-2">
      <select
        className="select select-bordered select-sm grow h-4"
        value={filters.tabs.type}
        onChange={(e) => {
          if (Object.values(TabFilterType).includes(e.target.value as any)) {
            setTabFilterType(e.target.value as TabFilterType);
          }
        }}
      >
        <StatsOptions />
      </select>

      <button
        className="p-1 btn btn-ghost btn-sm btn-outline border-gray-300"
        onClick={() => toggleSearchVisible(!searchVisible)}
      >
        <MdSearch aria-label="Search tabs" className="p-1" size={24} />
      </button>

      <FilterDropdown
        groupBy={filters.grouping.groupBy}
        sortBy={filters.grouping.sortBy}
        onChangeGroupBy={(groupBy) => setTabGrouping(groupBy)}
        onChangeSortOrder={(sortBy) => setGroupSortBy(sortBy)}
      />
    </div>
  );
}

function StatsOptions() {
  const groupsAtom = useAtomValue(filteredTabGroups);

  const stats =
    groupsAtom.state === 'hasData'
      ? groupsAtom.data.stats
      : {
          audible: [],
          duplicates: [],
        };

  return (
    <>
      <FilterSelectOption value={TabFilterType.All} key="all">
        All
      </FilterSelectOption>
      <FilterSelectOption value={TabFilterType.CurrentWindow} key="window">
        Current Window
      </FilterSelectOption>
      <FilterSelectOption
        key="audible"
        count={stats.audible.length}
        value={TabFilterType.Audible}
      >
        Audible
      </FilterSelectOption>
      <FilterSelectOption
        key="duplicates"
        count={stats.duplicates.length}
        value={TabFilterType.Duplicates}
      >
        Duplicates
      </FilterSelectOption>
    </>
  );
}

function FilterSelectOption({
  children,
  value,
  count,
}: {
  children: ReactNode;
  value: string;
  count?: number;
}) {
  return (
    <option value={value}>
      {count ? `(${count}) - ` : ''} {children}
    </option>
  );
}

const SortOrderOptions = [
  { label: 'Count', value: GroupSortOrder.Count },
  { label: 'Ascending', value: GroupSortOrder.Asc },
  { label: 'Descending', value: GroupSortOrder.Desc },
];

const GroupByOptions = [
  { label: 'Domain', value: GroupTabsByOptions.Domain },
  { label: 'Window', value: GroupTabsByOptions.Window },
];

if (Features.TAB_GROUPING) {
  GroupByOptions.push({
    label: 'Tab Groups',
    value: GroupTabsByOptions.TabGroups,
  });
}

function FilterDropdown({
  groupBy,
  sortBy,
  onChangeGroupBy,
  onChangeSortOrder,
}: {
  groupBy: GroupTabsByOptions;
  sortBy: GroupSortOrder;
  onChangeSortOrder: (order: GroupSortOrder) => void;
  onChangeGroupBy: (groupBy: GroupTabsByOptions) => void;
}) {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        className="p-1 btn btn-ghost btn-sm btn-outline border-gray-300"
      >
        <MdSort size={24} />
      </div>

      <ul
        tabIndex={0}
        className="dropdown-content menu rounded-box w-32 shadow-lg bg-base-100 z-[1]"
      >
        <li className="menu-title">
          <span>Order</span>
        </li>
        {SortOrderOptions.map((option) => (
          <FilterMenuItem
            selected={sortBy === option.value}
            key={option.value}
            onClick={() => onChangeSortOrder(option.value)}
          >
            {option.label}
          </FilterMenuItem>
        ))}

        <li className="menu-title">
          <span>Group By</span>
        </li>

        {GroupByOptions.map((option) => (
          <FilterMenuItem
            selected={groupBy === option.value}
            key={option.value}
            onClick={() => onChangeGroupBy(option.value)}
          >
            {option.label}
          </FilterMenuItem>
        ))}
      </ul>
    </div>
  );
}

const FilterMenuItem = ({
  selected,
  children,
  onClick,
}: {
  selected?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <li className={selected ? 'active font-bold' : ''} onClick={onClick}>
      <a>{children}</a>
    </li>
  );
};
