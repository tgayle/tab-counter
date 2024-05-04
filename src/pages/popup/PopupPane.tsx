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
import { ArchivedTabsPane } from '../../features/archives/ArchivedTabsPane';
import { ArchivedTabDropZone } from '../../features/archives/ArchivedTabDropZone';
import Features from '../../Features';

export const PopupPane = ({ sidePanel }: { sidePanel?: boolean }) => {
  const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

  const {
    all: allTabs,
    incognito: incogTabs,
    normal: normalTabs,
  } = useAtomValue(allTabsAtom);

  const tabTitles: (TabDescription | null)[] = [
    Features.TAB_ARCHIVING
      ? ([ActiveTab.Archived, 'Archived', 0] as const)
      : null,
    [ActiveTab.All, 'All', allTabs.length],
    normalTabs.length && incogTabs.length
      ? [ActiveTab.Normal, 'Normal', normalTabs.length]
      : null,
    incogTabs.length ? [ActiveTab.Incog, 'Incognito', incogTabs.length] : null,
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
    <div className="w-full max-w-full h-screen max-h-screen flex flex-col relative">
      <TabFilterRow
        tabTitles={tabTitles}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      <main className=" overflow-y-auto flex flex-col flex-grow ">
        {selectedTab === ActiveTab.Tools ? <ToolsPane /> : <OpenTabGroup />}
      </main>

      {sidePanel && <ArchivedTabDropZone />}
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
  const activeTab = useAtomValue(selectedTabAtom);

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

  if (activeTab === ActiveTab.Archived) {
    return <ArchivedTabsPane />;
  }

  if (!groups || !currentWindow) {
    return null;
  }

  if (groups.type === 'domain') {
    return (
      <>
        {groups.results.map(({ tabs, origin, rule, displayName }, index) => (
          <GroupAccordionItem
            title={displayName ?? origin}
            tabs={tabs}
            key={rule?.id ?? origin}
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
        ))}
      </>
    );
  }

  if (groups.type === 'window') {
    return (
      <>
        {groups.results.map(({ window, tabs }, index) => (
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
        ))}
      </>
    );
  }

  if (groups.type === 'tab_group') {
    return (
      <>
        {groups.results.map(({ tabs, tabGroup: group, displayName }) => (
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
        ))}
      </>
    );
  }

  return <>how did you get here? (grouping={JSON.stringify(groups)})</>;
};

type TabDescription = readonly [
  type: ActiveTab,
  name: ReactNode,
  count: number,
];
function TabFilterRow({
  selectedTab,
  setSelectedTab,
  tabTitles,
}: {
  tabTitles: (TabDescription | null)[];
  selectedTab: ActiveTab;
  setSelectedTab: (update: ActiveTab) => void;
}) {
  return (
    <div className="max-w-full sticky top-0 bg-white z-20 grid overflow-x-clip h-min ">
      <div className="tabs max-w-full tabs-bordered  w-full overflow-x-auto relative bg-base-100 transition-colors duration-300">
        {tabTitles.map((title, i) => {
          if (!title) {
            return null;
          }

          const [type] = title;
          return (
            <Tab
              tab={title}
              key={type}
              style={{
                borderBottomColor:
                  type === selectedTab ? 'oklch(var(--n))' : undefined,
              }}
              className={clsx(
                'border-primary',
                i === tabTitles.length - 1 && 'pr-14',
              )}
            />
          );
        })}
      </div>

      <button
        className={clsx(
          'absolute right-0 rounded-l-full px-4 btn btn-sm btn-neutral transition-colors duration-300 no-animation outline-none',
          selectedTab === ActiveTab.Tools ? 'btn-active' : 'bg-base-100',
        )}
        style={{
          boxShadow: '-4px 0px 5px 0px oklch(var(--b3))',
        }}
        onClick={() => setSelectedTab(ActiveTab.Tools)}
      >
        <MdBuild
          size={16}
          key="settings_icon"
          className={clsx(
            'h-8',
            selectedTab === ActiveTab.Tools
              ? 'text-base-100'
              : 'text-base-content',
          )}
        />
      </button>
    </div>
  );

  function Tab({
    tab: [type, displayText, count],
    className,
    style,
  }: {
    tab: TabDescription;
    style?: React.CSSProperties;
    className?: string;
  }) {
    return (
      <button
        key={type}
        className={clsx(
          'tab px-3 whitespace-pre flex-nowrap max-w-full ',
          selectedTab === type && 'tab-active col-span-2',
          className,
        )}
        onClick={() => setSelectedTab(type)}
        style={style}
      >
        {displayText}{' '}
        {type !== ActiveTab.Tools && count > 0 ? (
          <span className="min-w-0 tab-tab-count">({count})</span>
        ) : (
          ''
        )}
      </button>
    );
  }
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
