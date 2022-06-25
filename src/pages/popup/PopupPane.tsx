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
import React, { useRef, useState } from 'react';
import { getTabsStats } from '../../action/TabStats';
import { TabItem } from '../../components/tab/TabItem';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useTabInfo } from '../../hooks/useTabInfo';
import { useStore } from '../../store';
import { closeWindow, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';

export const PopupPane = () => {
  const { tabs, loading } = useTabInfo();
  const { all: allTabs, incognito: incogTabs, normal: normalTabs } = tabs;
  const selectedTab = useStore((state) => state.state.activeTab);
  const setSelectedTab = useStore((state) => state.state.setActiveTab);
  const tabTitles = [
    `All (${allTabs.length})`,
    normalTabs.length && incogTabs.length
      ? `Normal (${normalTabs.length})`
      : null,
    incogTabs.length ? `Incognito (${incogTabs.length})` : null,
  ];

  return (
    <div style={{ width: '350px', maxWidth: '350px' }}>
      <Tabs isLazy index={selectedTab} onChange={setSelectedTab}>
        {loading && <Progress isIndeterminate />}
        <TabList>
          {tabTitles.map((title) =>
            title ? <Tab key={title}>{title}</Tab> : null,
          )}
        </TabList>

        <TabPanels>
          {[allTabs, normalTabs, incogTabs].map((tabs, i) => (
            <TabPanel key={i}>
              <OpenTabGroup tabs={tabs} />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
};

const OpenTabGroup = ({ tabs }: { tabs: TabType[] }) => {
  const stats = getTabsStats(tabs);
  const groups = useStore(({ state }) => state.groups);
  const searchQuery = useStore(({ state: { query } }) => query.query);
  const setSearchQuery = useStore(({ state }) => state.setSearchQuery);
  const searchVisible = useStore(({ ui }) => ui.searchVisible);
  const expandedSections = useStore(({ ui }) => ui.expandedSections);
  const toggleSection = useStore(({ ui }) => ui.toggleSection);

  return (
    <div>
      <TabGroupFilterSection stats={stats} />

      {searchVisible && (
        <Input
          size="sm"
          width="full"
          aria-label="Search for a tab"
          placeholder="Enter a name or URL"
          mt={2}
          value={searchQuery}
          autoFocus
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      <Accordion
        allowMultiple
        allowToggle
        mt={2}
        index={expandedSections}
        onChange={(index) => {
          toggleSection(index as number[]);
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
                <MenuItem
                  onClick={(e) => (e.preventDefault(), onRemoveWindow?.())}
                >
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
