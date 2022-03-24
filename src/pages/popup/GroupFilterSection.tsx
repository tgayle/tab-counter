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
  Tag,
  TagProps,
  Box,
} from '@chakra-ui/react';
import React from 'react';
import { MdSearch, MdSort } from 'react-icons/md';
import {
  TabFilterType,
  GroupTabsByOptions,
  GroupSortOrder,
  useFilterSettings,
} from '../../hooks/useFilterSettings';
import { TabStats } from '../../tabutil';

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
      <FilterTag
        currentFilter={filter}
        filter={TabFilterType.Audible}
        scheme="green"
        onChange={setTabFilterType}
      >
        Audible{stats.audible.length ? ` (${stats.audible.length})` : ''}
      </FilterTag>

      <FilterTag
        currentFilter={filter}
        filter={TabFilterType.CurrentWindow}
        scheme="blue"
        onChange={setTabFilterType}
      >
        Current Window
      </FilterTag>

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

const FilterTag = ({
  scheme,
  currentFilter,
  filter,
  onChange,
  children,
}: React.PropsWithChildren<{
  scheme: TagProps['colorScheme'];
  currentFilter: TabFilterType;
  filter: TabFilterType;
  onChange: (filter: TabFilterType) => void;
}>) => {
  return (
    <Tag
      colorScheme={currentFilter === filter ? scheme : 'gray'}
      onClick={() => onChange(filter)}
    >
      {children}
    </Tag>
  );
};
