import React, { useEffect, useRef } from 'react';
import { TabItem } from '../../components/tab/TabItem';
import { ActiveTab } from '../../store';
import { closeTab, closeWindow, Tab as TabType } from '../../tabutil';
import { TabGroupFilterSection } from './GroupFilterSection';
import { MdChevronLeft, MdMoreVert, MdSettings } from 'react-icons/md';
import { SettingsPane } from './SettingsPane';
import autoAnimate from '@formkit/auto-animate';
import clsx from 'clsx';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  allTabsAtom,
  filteredTabGroups,
  searchQueryAtom,
  searchVisibleAtom,
} from '../../state/tabs';
import {
  expandedSectionsAtom,
  selectedTabAtom,
  toggleSectionExpansion,
} from '../../state/ui';

export const PopupPane = () => {
  const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

  const {
    all: allTabs,
    incognito: incogTabs,
    normal: normalTabs,
  } = useAtomValue(allTabsAtom);

  const t = useAtomValue(allTabsAtom);

  console.log(t);

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
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const searchVisible = useAtomValue(searchVisibleAtom);

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
        <TabGroupItems />
      </div>
    </div>
  );
};

const TabGroupItems = () => {
  const expandedSections = useAtomValue(expandedSectionsAtom);
  const toggleSection = useSetAtom(toggleSectionExpansion);
  const groupAtom = useAtomValue(filteredTabGroups);

  const lastValue = useRef(
    groupAtom.state === 'hasData' ? groupAtom.data : null,
  );

  useEffect(() => {
    if (groupAtom.state === 'hasData') {
      lastValue.current = groupAtom.data;
    }
  }, [groupAtom.state]);

  const groups =
    groupAtom.state === 'hasData' ? groupAtom.data : lastValue.current;

  if (!groups) {
    return null;
  }

  return (
    <>
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
    </>
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
        className="flex font-medium p-2 items-center cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onOpen}
      >
        <span className="grow truncate text-md" title={title}>
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
