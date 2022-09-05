import React, { ReactNode } from 'react';
import { MdSearch, MdSort } from 'react-icons/md';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
} from '../../action/TabFilter';
import { useStore } from '../../store';

export function TabGroupFilterSection() {
  const stats = useStore(({ state }) => state.groups.stats);
  const toggleSearchVisible = useStore(({ ui }) => ui.toggleSearchVisible);
  const setTabFilterType = useStore(({ state }) => state.setTabFilterType);
  const setTabGrouping = useStore(({ state }) => state.setTabGrouping);
  const setGroupSortBy = useStore(({ state }) => state.setGroupSortBy);
  const filters = useStore(({ state }) => state.query);

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
        <FilterSelectOption value={TabFilterType.All}>All</FilterSelectOption>
        <FilterSelectOption value={TabFilterType.CurrentWindow}>
          Current Window
        </FilterSelectOption>
        <FilterSelectOption
          count={stats.audible.length}
          value={TabFilterType.Audible}
        >
          Audible
        </FilterSelectOption>
        <FilterSelectOption
          count={stats.duplicates.length}
          value={TabFilterType.Duplicates}
        >
          Duplicates
        </FilterSelectOption>
      </select>

      <div
        className="p-1 btn btn-ghost btn-sm btn-outline border-gray-300"
        onClick={toggleSearchVisible}
      >
        <MdSearch aria-label="Search tabs" className="p-1" size={24} />
      </div>

      <FilterDropdown
        groupBy={filters.grouping.groupBy}
        sortBy={filters.grouping.sortBy}
        onChangeGroupBy={(groupBy) => setTabGrouping(groupBy)}
        onChangeSortOrder={(sortBy) => setGroupSortBy(sortBy)}
      />
    </div>
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
        className="dropdown-content menu rounded-box w-32 shadow-lg bg-base-100"
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
    <li className={selected ? 'bordered' : ''} onClick={onClick}>
      <a>{children}</a>
    </li>
  );
};
