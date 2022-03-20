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
} from '@chakra-ui/react';
import React from 'react';
import { MdSearch, MdSort } from 'react-icons/md';
import { TabFilterType, SortOrder } from '../../hooks/useFilteredTabs';
import { TabStats } from '../../tabutil';

type UseBooleanResult = ReturnType<typeof useBoolean>[1];

export function TabGroupFilterSection({
  filter,
  searchHandlers,
  setFilter,
  setSortOrder,
  sortOrder,
  stats,
}: {
  filter: TabFilterType;
  setFilter: (newFilter: TabFilterType) => void;
  stats: TabStats;
  searchHandlers: UseBooleanResult;
  sortOrder: string;
  setSortOrder: (order: SortOrder) => void;
}) {
  return (
    <HStack spacing={2}>
      <FilterTag
        currentFilter={filter}
        filter={TabFilterType.Audible}
        scheme="green"
        onChange={setFilter}
      >
        Audible{stats.audible.length ? ` (${stats.audible.length})` : ''}
      </FilterTag>

      <FilterTag
        currentFilter={filter}
        filter={TabFilterType.CurrentWindow}
        scheme="blue"
        onChange={setFilter}
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
            type="radio"
            value={sortOrder}
            onChange={(choice) => setSortOrder(choice as SortOrder)}
          >
            <MenuItemOption value={SortOrder.Count}>Count</MenuItemOption>
            <MenuItemOption value={SortOrder.Asc}>Ascending</MenuItemOption>
            <MenuItemOption value={SortOrder.Desc}>Descending</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
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
