import {
  Tabs,
  Progress,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
  HStack,
  IconButton,
  List,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Spacer,
  Tag,
  Input,
  useBoolean,
  Divider,
  TagProps,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { MdSort, MdSearch } from 'react-icons/md';
import { TabItem } from '../../components/tab/TabItem';
import {
  useFilteredTabs,
  SortOrder,
  TabFilterArg,
} from '../../hooks/useFilteredTabs';
import { useTabInfo } from '../../hooks/useTabInfo';
import { getTabsStats, Tab as TabType } from '../../tabutil';

export const PopupPane = () => {
  const { tabs, loading } = useTabInfo();

  if (loading) return null;

  const { all: allTabs, incognito: incogTabs, normal: normalTabs } = tabs;

  return (
    <div style={{ width: '350px' }}>
      <Tabs>
        {loading && <Progress isIndeterminate />}
        <TabList>
          <Tab>All ({allTabs.length})</Tab>
          {normalTabs.length && incogTabs.length ? (
            <Tab>Normal ({normalTabs.length})</Tab>
          ) : null}
          {incogTabs.length ? <Tab>Incognito ({incogTabs.length})</Tab> : null}
        </TabList>

        <TabPanels>
          <TabPanel>
            <OpenTabGroup tabs={allTabs} />
          </TabPanel>
          <TabPanel>
            <OpenTabGroup tabs={normalTabs} />
          </TabPanel>
          <TabPanel>
            <OpenTabGroup tabs={incogTabs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

const FilterTag = ({
  scheme,
  currentFilter,
  filter,
  onChange,
  children,
}: React.PropsWithChildren<{
  scheme: TagProps['colorScheme'];
  currentFilter: TabFilterArg;
  filter: TabFilterArg;
  onChange: (filter: TabFilterArg) => void;
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

const OpenTabGroup = ({ tabs }: { tabs: TabType[] }) => {
  const stats = getTabsStats(tabs);
  const [searchVisible, searchHandlers] = useBoolean(false);
  const [searchEntry, setSearchEntry] = useState('');
  const { filter, setFilter, setSortOrder, sortedDomains, sortOrder } =
    useFilteredTabs(tabs, searchEntry);

  return (
    <div>
      <HStack spacing={2}>
        <FilterTag
          currentFilter={filter}
          filter="audible"
          scheme="green"
          onChange={setFilter}
        >
          Audible{stats.audible.length ? ` (${stats.audible.length})` : ''}
        </FilterTag>

        <FilterTag
          currentFilter={filter}
          filter="currentwindow"
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
              <MenuItemOption value="count">Count</MenuItemOption>
              <MenuItemOption value="asc">Ascending</MenuItemOption>
              <MenuItemOption value="desc">Descending</MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
      </HStack>

      {searchVisible && (
        <Input
          size="sm"
          width="full"
          aria-label="Search for a tab"
          placeholder="Enter a name or URL"
          mt={2}
          value={searchEntry}
          autoFocus
          onChange={(e) => setSearchEntry(e.target.value)}
        />
      )}

      {sortedDomains.map(({ domain, tabs }, index) => (
        <div key={domain}>
          <DomainSection domain={domain} tabs={tabs} />
          {index !== sortedDomains.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
};

const DomainSection = ({
  domain,
  tabs,
}: {
  domain: string;
  tabs: TabType[];
}) => {
  return (
    <div>
      <Heading as="h3" size="sm">
        {domain} ({tabs.length})
      </Heading>
      <List spacing={1}>
        {tabs.map((tab, index) => (
          <div key={tab.id}>
            <TabItem tab={tab} />
            {index !== tabs.length - 1 && <Divider />}
          </div>
        ))}
      </List>
    </div>
  );
};
