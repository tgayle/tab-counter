import React, { useEffect, useRef } from 'react';
import { TabItem } from '../../components/tab/TabItem';
import { useStore, ActiveTab } from '../../store';
import { closeTab, closeWindow, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';
import { MdChevronLeft, MdMoreVert, MdSettings } from 'react-icons/md';
import { SettingsPane } from './SettingsPane';
import autoAnimate from '@formkit/auto-animate';
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
    <MdSettings size={16} key="settings_icon" />,
  ];

  return (
    <div style={{ width: '350px', maxWidth: '350px' }}>
      <div className="tabs w-full">
        {tabTitles.map((title, index) =>
          title ? (
            <button
              key={index}
              className={clsx(
                'tab tab-lifted px-3',
                selectedTab === index && 'tab-active grow',
              )}
              onClick={() => setSelectedTab(index)}
            >
              {title}
            </button>
          ) : null,
        )}
      </div>

      <main className="h-full">
        {selectedTab === ActiveTab.Settings ? (
          <SettingsPane />
        ) : (
          <OpenTabGroup />
        )}
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

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  return (
    <div>
      <div className="p-2">
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
      </div>

      <div className="divide-y pb-2" ref={containerRef}>
        {groups.type === 'domain'
          ? groups.results.map(({ tabs, origin, rule, displayName }, index) => (
              <GroupAccordionItem
                title={displayName ?? origin}
                tabs={tabs}
                key={rule?.id}
                open={expandedSections.has(rule?.id ?? index)}
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
  onRemoveGroup,
  open,
  removeGroupText = 'Close Window',
  onOpen,
}: {
  title: string;
  tabs: TabType[];
  onRemoveGroup?: () => void;
  removeGroupText?: string;
  open?: boolean;
  onOpen?(): void;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  return (
    <div>
      <div
        className="text-base flex font-medium p-2 items-center cursor-pointer hover:bg-gray-200 transition-colors"
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

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            className="btn btn-circle btn-ghost btn-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MdMoreVert size={16} />
          </div>

          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48"
          >
            <li onClick={() => onRemoveGroup?.()}>
              <a>{removeGroupText}</a>
            </li>
          </ul>
        </div>
      </div>
      <div ref={containerRef}>{open && <BrowserTabList tabs={tabs} />}</div>
    </div>
  );
};

const BrowserTabList = ({ tabs }: { tabs: TabType[] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  return (
    <div className="divide-y" ref={containerRef}>
      {tabs.map((tab) => (
        <TabItem tab={tab} key={tab.id} />
      ))}
    </div>
  );
};
