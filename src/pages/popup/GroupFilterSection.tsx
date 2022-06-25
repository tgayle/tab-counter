import {
  IconButton,
  HStack,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Spacer,
  Box,
  Select,
} from '@chakra-ui/react';
import React, { ReactNode } from 'react';
import { MdSearch, MdSort } from 'react-icons/md';
import { TabStats } from '../../action/TabStats';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
} from '../../action/TabFilter';
import { useStore } from '../../store';

type Props = {
  stats: TabStats;
};

export function TabGroupFilterSection({ stats }: Props) {
  const toggleSearchVisible = useStore(({ ui }) => ui.toggleSearchVisible);
  const setTabFilterType = useStore(({ state }) => state.setTabFilterType);
  const setTabGrouping = useStore(({ state }) => state.setTabGrouping);
  const setGroupSortBy = useStore(({ state }) => state.setGroupSortBy);
  const filters = useStore(({ state }) => state.query);

  return (
    <HStack spacing={2}>
      <Select
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
      </Select>

      <Spacer />

      <IconButton
        aria-label="Search tabs"
        size="sm"
        icon={<MdSearch />}
        variant="outline"
        onClick={toggleSearchVisible}
      />

      <Box>
        <Menu closeOnSelect={false}>
          <MenuButton
            size="sm"
            as={IconButton}
            aria-label="Sort Order"
            icon={<MdSort />}
            variant="outline"
          />

          <MenuList>
            <MenuOptionGroup
              defaultValue="count"
              title="Order"
              type="radio"
              value={filters.grouping.sortBy}
              onChange={(choice) => setGroupSortBy(choice as GroupSortOrder)}
            >
              <MenuItemOption value={GroupSortOrder.Count}>
                Count
              </MenuItemOption>
              <MenuItemOption value={GroupSortOrder.Asc}>
                Ascending
              </MenuItemOption>
              <MenuItemOption value={GroupSortOrder.Desc}>
                Descending
              </MenuItemOption>
            </MenuOptionGroup>

            {
              <MenuOptionGroup
                title="Group by"
                onChange={(option) =>
                  setTabGrouping(option as GroupTabsByOptions)
                }
                value={filters.grouping.groupBy}
              >
                <MenuItemOption value="domain">Domain</MenuItemOption>
                <MenuItemOption value="window">Window</MenuItemOption>
              </MenuOptionGroup>
            }
          </MenuList>
        </Menu>
      </Box>
    </HStack>
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
