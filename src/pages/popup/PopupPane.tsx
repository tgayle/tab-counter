import React, {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ActiveTab } from '../../store';
import {
  BrowserWindow,
  canTabMoveToWindow,
  closeTab,
  closeWindow,
  getCurrentWindow,
  moveTabToWindow,
} from '../../tabutil';
import { TabFilterSection } from './TabFilterSection';
import { MdBuild } from 'react-icons/md';
import { ToolsPane } from './ToolsPane';
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

  const tabTitles: (
    | [type: ActiveTab, name: ReactNode, count: number]
    | null
  )[] = [
    [ActiveTab.All, 'All', allTabs.length],
    normalTabs.length && incogTabs.length
      ? [ActiveTab.Normal, 'Normal', normalTabs.length]
      : null,
    incogTabs.length ? [ActiveTab.Incog, 'Incognito', incogTabs.length] : null,
    [ActiveTab.Tools, <MdBuild size={16} key="settings_icon" />, 0],
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
    <div className="w-full max-w-full h-full max-h-screen flex flex-col">
      <TabFilterRow
        tabTitles={tabTitles}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      <main className=" overflow-y-auto flex flex-col">
        {selectedTab === ActiveTab.Tools ? <ToolsPane /> : <OpenTabGroup />}
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
        : groups.type === 'tab_group'
        ? groups.results.map(({ tabs, tabGroup: group, displayName }) => (
            <GroupAccordionItem
              title={displayName || group.title || tabs[0]?.title || 'Unkown'}
              tabs={tabs}
              key={group.id}
              open={expandedSections.has(group.id)}
              onOpen={() => toggleSection(group.id)}
              onRemoveGroup={() => closeTab(...tabs)}
              removeGroupText="Close Group"
              mergeGroupText="Move all tabs here"
              alwaysShowGroup
            />
          ))
        : `how did you get here? (grouping=${JSON.stringify(groups)})`}
    </>
  );
};

function TabFilterRow({
  selectedTab,
  setSelectedTab,
  tabTitles,
}: {
  tabTitles: ([type: ActiveTab, name: ReactNode, count: number] | null)[];
  selectedTab: ActiveTab;
  setSelectedTab: (update: ActiveTab) => void;
}) {
  const [hasOverflow, setHasOverflow] = useState(false);

  useLayoutEffect(
    () => {
      const hasOverflow = Array.from(
        document.querySelectorAll<HTMLElement>('.tab .tab-tab-count'),
      ).some((it) => it.clientWidth < it.scrollWidth);

      setHasOverflow(hasOverflow);
    },
    tabTitles.map((it) => it?.[2]),
  );

  return (
    <div
      className="tabs max-w-full tabs-bordered w-full wrap sticky top-0 bg-white z-20"
      style={{
        gridTemplateColumns: `repeat(${
          tabTitles.filter(Boolean).length
        }, minmax(0, 1fr))`,
      }}
    >
      {tabTitles.map((title) => {
        if (!title) {
          return null;
        }

        const [type, displayText, count] = title;

        return (
          <button
            key={type}
            className={clsx(
              'tab px-3 whitespace-pre flex-nowrap max-w-full ',
              selectedTab === type && 'tab-active col-span-2',
            )}
            onClick={() => setSelectedTab(type)}
          >
            {displayText}{' '}
            {type !== ActiveTab.Tools &&
            (!hasOverflow || selectedTab === type) ? (
              <span className="min-w-0 tab-tab-count">({count})</span>
            ) : (
              ''
            )}
          </button>
        );
      })}
    </div>
  );
}

function useCurrentWindow() {
  const [currentWindow, setCurrentWindow] = useState<BrowserWindow | null>(
    null,
  );

  useEffect(() => {
    getCurrentWindow().then((window) => setCurrentWindow(window));
  }, []);

  return currentWindow;
}
