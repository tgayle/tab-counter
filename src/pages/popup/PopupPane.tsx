import { Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { TabItem } from '../../components/tab/TabItem';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useStore } from '../../store';
import { closeTab, closeWindow, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';
import { MdChevronLeft } from 'react-icons/md';
import clsx from 'clsx';

export const PopupPane = () => {
  const selectedTab = useStore((state) => state.state.activeTab);
  const setSelectedTab = useStore((state) => state.state.setActiveTab);
  const allTabs = useStore(({ state }) => state.allTabs);
  const incogTabs = useStore(({ state }) => state.incognitoTabs);
  const normalTabs = useStore(({ state }) => state.normalTabs);

  const tabTitles = [
    `All (${allTabs.length})`,
    normalTabs.length && incogTabs.length
      ? `Normal (${normalTabs.length})`
      : null,
    incogTabs.length ? `Incognito (${incogTabs.length})` : null,
  ];

  return (
    <div style={{ width: '350px', maxWidth: '350px' }}>
      <div className="tabs">
        {tabTitles.map((title, index) =>
          title ? (
            <button
              key={index}
              className={clsx(
                'tab',
                'tab-lifted',
                selectedTab === index && 'tab-active',
              )}
              onClick={() => setSelectedTab(index)}
            >
              {title}
            </button>
          ) : null,
        )}
      </div>

      <main className="m-2">
        <OpenTabGroup />
      </main>
    </div>
  );
};

const OpenTabGroup = () => {
  const groups = useStore(({ state }) => state.groups);
  const searchQuery = useStore(({ state: { query } }) => query.query);
  const setSearchQuery = useStore(({ state }) => state.setSearchQuery);
  const searchVisible = useStore(({ ui }) => ui.searchVisible);
  const expandedSections = useStore(({ ui }) => ui.expandedSections);
  const toggleSection = useStore(({ ui }) => ui.toggleSection);

  return (
    <div>
      <TabGroupFilterSection />

      {searchVisible && (
        <input
          type="text"
          className="input w-full input-bordered input-sm mt-2"
          aria-label="Search for a tab"
          placeholder="Search"
          value={searchQuery}
          autoFocus
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      <div className="divide-y">
        {groups.type === 'domain'
          ? groups.results.map(({ tabs, origin, rule, displayName }, index) => (
              <GroupAccordionItem
                title={displayName ?? origin}
                tabs={tabs}
                key={rule?.id}
                open={expandedSections.has(rule?.id ?? index)}
                hasMenu
                onOpen={() => toggleSection(rule?.id ?? index)}
                removeGroupText="Close All"
                onRemoveGroup={() => closeTab(...tabs)}
              />
            ))
          : groups.type === 'window'
          ? groups.results.map(({ window, tabs }, index) => (
              <GroupAccordionItem
                title={tabs.find((it) => it.active)?.title ?? `#${window.id}`}
                tabs={tabs}
                key={window.id}
                hasMenu
                open={expandedSections.has(window.id ?? index)}
                onOpen={() => toggleSection(window.id ?? index)}
                onRemoveGroup={() => closeWindow(window)}
                removeGroupText="Close Window"
              />
            ))
          : `how did you get here? (grouping=${JSON.stringify(groups)})`}
      </div>
    </div>
  );
};

const GroupAccordionItem = ({
  title,
  tabs,
  hasMenu,
  onRemoveGroup,
  open,
  removeGroupText = 'Close Window',
  onOpen,
}: {
  title: string;
  tabs: TabType[];
  hasMenu?: boolean;
  onRemoveGroup?: () => void;
  removeGroupText?: string;
  open?: boolean;
  onOpen?(): void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  useContextMenu({
    onOpen: () => setMenuOpen(true),
    onClose: () => setMenuOpen(false),
    buttonRef,
    enabled: !!hasMenu,
    menuRef,
  });

  return (
    <div>
      <div
        className="text-base flex font-medium p-2 items-center cursor-pointer hover:bg-gray-200 transition-colors"
        ref={buttonRef}
        onClick={onOpen}
      >
        <span className="grow truncate" title={title}>
          {title}
        </span>

        <span className="flex items-center gap-2 pl-2">
          <span>({tabs.length})</span>
          <MdChevronLeft
            size={24}
            className={
              'transition-transform ' + (open ? 'rotate-90' : '-rotate-90')
            }
          />
        </span>

        <Menu isOpen={menuOpen}>
          <MenuButton as="span" />
          <MenuList ref={menuRef}>
            <MenuItem onClick={(e) => (e.preventDefault(), onRemoveGroup?.())}>
              {removeGroupText}
            </MenuItem>
          </MenuList>
        </Menu>
      </div>
      <div>{open && <BrowserTabList tabs={tabs} />}</div>
    </div>
  );
};

const BrowserTabList = ({ tabs }: { tabs: TabType[] }) => {
  return (
    <div className="divide-y">
      {tabs.map((tab) => (
        <div key={tab.id}>
          <TabItem tab={tab} />
        </div>
      ))}
    </div>
  );
};
