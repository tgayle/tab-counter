import React, { useEffect, useRef, useState } from 'react';
import { ActiveTab } from '../../store';
import {
  BrowserWindow,
  canTabMoveToWindow,
  closeTab,
  closeWindow,
  getCurrentWindow,
  moveTabToWindow,
  Tab as TabType,
} from '../../tabutil';
import { TabFilterSection } from './TabFilterSection';
import { MdSettings } from 'react-icons/md';
import { SettingsPane } from './SettingsPane';
import autoAnimate from '@formkit/auto-animate';
import clsx from 'clsx';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { GroupAccordionItem } from '../../components/groups/GroupAccordionItem';
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
import { DeduplicateTabButton } from '../../components/DeduplicateTabsButton';
import { IncognitoTabOptions } from '../../components/IncognitoTabOptions';

export const PopupPane = () => {
  const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

  const {
    all: allTabs,
    incognito: incogTabs,
    normal: normalTabs,
  } = useAtomValue(allTabsAtom);

  const tabTitles = [
    `All (${allTabs.length})`,
    normalTabs.length && incogTabs.length
      ? `Normal (${normalTabs.length})`
      : null,
    incogTabs.length ? `Incognito (${incogTabs.length})` : null,
    <MdSettings size={16} key="settings_icon" />,
  ];

  useEffect(() => {
    console.log(selectedTab, normalTabs.length, incogTabs.length);
    if (
      (selectedTab === ActiveTab.Normal && !normalTabs.length) ||
      (selectedTab === ActiveTab.Incog && !incogTabs.length)
    ) {
      setSelectedTab(ActiveTab.All);
    }
  }, [selectedTab, normalTabs.length, incogTabs.length]);

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
        <TabFilterSection />

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

      <DeduplicateTabButton />
      <IncognitoTabOptions />
    </div>
  );
};

const TabGroupItems = () => {
  const expandedSections = useAtomValue(expandedSectionsAtom);
  const toggleSection = useSetAtom(toggleSectionExpansion);
  const groupAtom = useAtomValue(filteredTabGroups);
  const currentWindow = useCurrentWindow();

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

  if (!groups || !currentWindow) {
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
              mergeGroupText="Move all tabs here"
              onMergeGroup={
                canTabMoveToWindow(tabs[0], currentWindow)
                  ? async () => {
                      moveTabToWindow(tabs, currentWindow);
                    }
                  : undefined
              }
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
              mergeGroupText="Move all tabs here"
              onMergeGroup={
                canTabMoveToWindow(tabs[0], currentWindow)
                  ? async () => {
                      moveTabToWindow(tabs, currentWindow);
                    }
                  : undefined
              }
            />
          ))
        : `how did you get here? (grouping=${JSON.stringify(groups)})`}
    </>
  );
};

function useCurrentWindow() {
  const [currentWindow, setCurrentWindow] = useState<BrowserWindow | null>(
    null,
  );

  useEffect(() => {
    getCurrentWindow().then((window) => setCurrentWindow(window));
  }, []);

  return currentWindow;
}
