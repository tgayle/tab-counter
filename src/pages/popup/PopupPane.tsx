import {
  Tabs,
  Progress,
  TabList,
  Text,
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
  AccordionIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { TabItem, TabItemMenuContext } from '../../components/tab/TabItem';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useCurrentWindow } from '../../hooks/useCurrentWindow';
import { useDebounce } from '../../hooks/useDebounce';
import { useFilteredTabs } from '../../hooks/useFilteredTabs';
import { useTabInfo } from '../../hooks/useTabInfo';
import { closeWindow, getTabsStats, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';

export const PopupPane = () => {
  const { tabs, loading } = useTabInfo();

  const [initialSearchQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const cb = (msg: { search: string }) => {
      if ('search' in msg) {
        setInitialQuery(msg.search);
        console.log('Received remote search request!', msg);
      }
    };

    chrome.runtime.onMessage.addListener(cb);
    return () => chrome.runtime.onMessage.removeListener(cb);
  }, []);

  if (loading) return null;

  const { all: allTabs, incognito: incogTabs, normal: normalTabs } = tabs;

  return (
    <div style={{ width: '350px', maxWidth: '350px' }}>
      <Tabs isLazy>
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
            <OpenTabGroup tabs={allTabs} searchQuery={initialSearchQuery} />
          </TabPanel>
          <TabPanel>
            <OpenTabGroup tabs={normalTabs} searchQuery={initialSearchQuery} />
          </TabPanel>
          <TabPanel>
            <OpenTabGroup tabs={incogTabs} searchQuery={initialSearchQuery} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

const OpenTabGroup = ({
  tabs,
  searchQuery,
}: {
  tabs: TabType[];
  searchQuery?: string;
}) => {
  const stats = getTabsStats(tabs);
  const [searchVisible, searchHandlers] = useBoolean(!!searchQuery);
  const [searchEntry, setSearchEntry] = useState(searchQuery ?? '');
  const debouncedQuery = useDebounce(searchEntry, 150);
  const {
    groupedTabs: groups,
    sortOptions,
    loading,
  } = useFilteredTabs(tabs, debouncedQuery);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  useEffect(() => {
    if (loading || (sortOptions.tabFilterType === 'all' && !debouncedQuery)) {
      setExpandedSections([]);
    }
  }, [sortOptions.tabFilterType, debouncedQuery]);

  useEffect(() => {
    if (!searchVisible) {
      setSearchEntry('');
    }
  }, [searchVisible]);

  return (
    <div>
      <TabGroupFilterSection searchHandlers={searchHandlers} stats={stats} />

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
        {groups.grouping === 'domain'
          ? groups.filteredTabs.map(({ domain, tabs }) => (
              <GroupAccordionItem title={domain} tabs={tabs} key={domain} />
            ))
          : groups.grouping === 'window'
          ? groups.filteredTabs.map(({ window, tabs }) => (
              <GroupAccordionItem
                title={tabs.find((it) => it.active)?.title ?? `#${window.id}`}
                tabs={tabs}
                key={window.id}
                hasWindowMenu
                onRemoveWindow={() => closeWindow(window)}
              />
            ))
          : `how did you get here? (grouping=${JSON.stringify(groups)})`}
      </Accordion>
    </div>
  );
};

const GroupAccordionItem = ({
  title,
  tabs,
  hasWindowMenu,
  onRemoveWindow,
}: {
  title: string;
  tabs: TabType[];
  hasWindowMenu?: boolean;
  onRemoveWindow?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  useContextMenu({
    onOpen: () => setMenuOpen(true),
    onClose: () => setMenuOpen(false),
    buttonRef,
    enabled: !!hasWindowMenu,
    menuRef,
  });

  return (
    <AccordionItem>
      {({ isExpanded }) => (
        <>
          <AccordionButton ref={buttonRef}>
            <Text flex={1} noOfLines={1} title={title} textAlign="start">
              {title}
            </Text>
            <span>({tabs.length})</span>
            <AccordionIcon ml={2} />
            <Menu isOpen={menuOpen}>
              <MenuButton as="span" />
              <MenuList ref={menuRef}>
                <MenuItem onClick={() => onRemoveWindow?.()}>
                  Close Window
                </MenuItem>
              </MenuList>
            </Menu>
          </AccordionButton>
          <AccordionPanel pb={0}>
            {isExpanded && <BrowserTabList tabs={tabs} />}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
};

const BrowserTabList = ({ tabs }: { tabs: TabType[] }) => {
  const [focusedTabMenu, setFocusedTabMenu] = useState<TabType | null>(null);
  const currentWindow = useCurrentWindow();

  return (
    <div>
      <TabItemMenuContext.Provider
        value={{
          tab: focusedTabMenu,
          openTabMenu: (tab) => setFocusedTabMenu(tab),
        }}
      >
        <List spacing={1}>
          {tabs.map((tab, index) => (
            <div key={tab.id}>
              <TabItem tab={tab} currentWindow={currentWindow} />
              {index !== tabs.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </TabItemMenuContext.Provider>
    </div>
  );
};
