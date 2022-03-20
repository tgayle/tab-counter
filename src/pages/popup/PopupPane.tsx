import {
  Tabs,
  Progress,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  List,
  Input,
  useBoolean,
  Divider,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Flex,
  AccordionIcon,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { TabItem } from '../../components/tab/TabItem';
import { useFilteredTabs } from '../../hooks/useFilteredTabs';
import { useTabInfo } from '../../hooks/useTabInfo';
import { getTabsStats, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';

export const PopupPane = () => {
  const { tabs, loading } = useTabInfo();

  if (loading) return null;

  const { all: allTabs, incognito: incogTabs, normal: normalTabs } = tabs;

  return (
    <div style={{ width: '350px', maxWidth: '350px' }}>
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

const OpenTabGroup = ({ tabs }: { tabs: TabType[] }) => {
  const stats = getTabsStats(tabs);
  const [searchVisible, searchHandlers] = useBoolean(false);
  const [searchEntry, setSearchEntry] = useState('');
  const { filter, setFilter, setSortOrder, sortedDomains, sortOrder } =
    useFilteredTabs(tabs, searchEntry);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  useEffect(() => {
    if (filter === 'all') {
      setExpandedSections([]);
    } else {
      const indexArray: number[] = [];
      for (let i = 0; i < sortedDomains.length; i++) {
        indexArray.push(i);
      }

      setExpandedSections(indexArray);
    }
  }, [filter]);

  return (
    <div>
      <TabGroupFilterSection
        filter={filter}
        searchHandlers={searchHandlers}
        setFilter={setFilter}
        setSortOrder={setSortOrder}
        sortOrder={sortOrder}
        stats={stats}
      />

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

      <Accordion
        allowMultiple
        allowToggle
        mt={2}
        index={expandedSections}
        onChange={(index) => {
          setExpandedSections(index as number[]);
        }}
      >
        {sortedDomains.map(({ domain, tabs }) => (
          <AccordionItem key={domain}>
            <AccordionButton>
              <Flex flex="1">{domain}</Flex>
              <span>({tabs.length})</span>
              <AccordionIcon pl={2} />
            </AccordionButton>
            <AccordionPanel pb={0}>
              <BrowserTabList tabs={tabs} />
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

const BrowserTabList = ({ tabs }: { tabs: TabType[] }) => {
  return (
    <div>
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
