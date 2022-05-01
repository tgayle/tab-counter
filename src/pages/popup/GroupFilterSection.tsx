import {
  useBoolean,
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
  useFilterSettings,
} from '../../hooks/useFilterSettings';

type UseBooleanResult = ReturnType<typeof useBoolean>[1];

type Props = {
  stats: TabStats;
  searchHandlers: UseBooleanResult;
};

export function TabGroupFilterSection({ searchHandlers, stats }: Props) {
  const {
    setTabFilterType: _setTabFilterType,
    setTabGrouping,
    groupSortBy,
    setGroupSortBy,
    tabGrouping,
    tabFilterType: filter,
  } = useFilterSettings();

  const setTabFilterType = (newFilter: TabFilterType) => {
    _setTabFilterType(filter === newFilter ? TabFilterType.All : newFilter);
  };

  return (
    <HStack spacing={2}>
      <Select
        value={filter}
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
        onClick={searchHandlers.toggle}
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
              value={groupSortBy}
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
                value={tabGrouping}
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
  console.log(children);
  return (
    <option value={value}>
      {count ? `(${count}) - ` : ''} {children}
    </option>
  );
}
