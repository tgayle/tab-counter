import { atom, useAtomValue } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { ArchivedTab, TabArchiver } from './TabArchiver';
import { tabFilterAtom } from '../../state/settings';
import { GroupSortOrder } from '../../action/TabFilter';
import { currentWindowAtom, tabGrouper } from '../../state/tabs';
import { closeTab, getCurrentTab } from '../../tabutil';
import clsx from 'clsx';

const archiver = new TabArchiver();
const archivedTabsAtom = atom<ArchivedTab[]>([]);

archivedTabsAtom.onMount = (set) => {
  archiver.init();
  return archiver.events.addListener((value) => {
    set(value);
  });
};

export function ArchivedTabsPane() {
  const tabs = useAtomValue(archivedTabsAtom);
  const {
    grouping: { sortBy },
    query,
  } = useAtomValue(tabFilterAtom);

  const sortedTabs = useMemo(() => {
    return tabs.slice().sort(sortArchivedTab(sortBy));
  }, [sortBy, tabs]);

  const filteredTabs = useMemo(() => {
    return sortedTabs.filter((tab) => {
      return (
        tab.title.toLowerCase().includes(query.toLowerCase()) ||
        tab.url.toLowerCase().includes(query.toLowerCase()) ||
        (tab.importedFrom &&
          (tab.importedFrom.title.toLowerCase().includes(query.toLowerCase()) ||
            tab.importedFrom.url.toLowerCase().includes(query.toLowerCase())))
      );
    });
  }, [sortBy, tabs, query]);

  return (
    <div>
      <div className="divide-y">
        <CurrentTabInfo tabs={sortedTabs} />

        <ArchivedTabStats tabs={sortedTabs} sortBy={sortBy} />

        {filteredTabs.map((tab, i) => (
          <ArchivedTabItem
            tab={tab}
            key={`${tab.time}_${tab.archiveCount}${tab.title}${tab.importedFrom?.title}${tab.url}`}
          />
        ))}
      </div>
    </div>
  );
}

function ArchivedTabItem({ tab }: { tab: ArchivedTab }) {
  const dateString = useMemo(() => {
    console.debug('Recalculating date string', tab.time, tab);
    return new Date(tab.time).toLocaleString();
  }, [tab.time]);

  return (
    <div className="p-2 overflow-clip text-ellipsis whitespace-nowrap">
      <a
        title={tab.url}
        href={tab.url}
        target="_blank"
        rel="noreferrer"
        className="link text-sm"
      >
        {tab.title.replace(/https?:\/\//, '')}
      </a>

      {tab.importedFrom && (
        <p
          className="text-xs text-gray-500  text-ellipsis overflow-hidden"
          title={tab.importedFrom.title}
        >
          Imported from:{' '}
          <a
            href={tab.importedFrom.url}
            className="link-hover"
            target="_blank"
            rel="noreferrer"
          >
            {tab.importedFrom.title}
          </a>
        </p>
      )}
      <p>
        {dateString}
        {(tab.archiveCount ?? 0) > 1
          ? ` - ${tab.archiveCount} occurrences`
          : ''}
      </p>
    </div>
  );
}

function ArchivedTabStats({
  tabs,
  sortBy,
}: {
  tabs: ArchivedTab[];
  sortBy: GroupSortOrder;
}) {
  const { duplicates } = useMemo(() => {
    const groupedByUrl = new Map<string, ArchivedTab[]>();

    for (const tab of tabs) {
      const key = tab.url;
      const value = groupedByUrl.get(key);
      if (value) {
        value.push(tab);
      } else {
        groupedByUrl.set(key, [tab]);
      }
    }

    const sorter = sortArchivedTab(sortBy);
    return {
      duplicates: Array.from(groupedByUrl.entries())
        .filter((it) => it[1].length > 1)
        .sort(([, a], [, b]) => {
          if (a.length !== b.length) {
            return b.length - a.length;
          }

          const newestA = a.sort((a, b) => b.time - a.time)[0];
          const newestB = b.sort((a, b) => b.time - a.time)[0];
          return newestB.time - newestA.time;
        })
        .sort(([, a], [, b]) => {
          return sorter(a[0], b[0]);
        }),
    };
  }, [tabs, sortBy]);

  return (
    <div className="p-2 text-sm ">
      <p className="text-gray-500">{tabs.length} archived tabs</p>
      <p>
        {duplicates.length} duplicates (
        {duplicates.reduce((a, b) => a + b[1].length - 1, 0)} redundant tabs)
      </p>
      <div className="flex justify-end">
        {duplicates.length > 0 && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              archiver.deduplicate(tabs);
            }}
          >
            Dedupe
          </button>
        )}
      </div>

      {duplicates.map(([url, dupes]) => (
        <div key={url} className="text-xs p-2">
          <p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="link overflow-hidden text-ellipsis"
            >
              {dupes[0].title}
            </a>
          </p>
          <p>
            {new Date(dupes[0].time).toLocaleString()} - {dupes.length}{' '}
            duplicates
          </p>
        </div>
      ))}
    </div>
  );
}

function sortArchivedTab(sortBy: GroupSortOrder) {
  return (a: ArchivedTab, b: ArchivedTab) => {
    switch (sortBy) {
      case GroupSortOrder.Asc:
        return a.time - b.time;
      case GroupSortOrder.Desc:
        return b.time - a.time;
      case GroupSortOrder.Count:
        a.archiveCount ??= 1;
        b.archiveCount ??= 1;

        if (a.archiveCount === b.archiveCount) {
          return b.time - a.time;
        }

        return b.archiveCount - a.archiveCount;
    }
  };
}

function CurrentTabInfo({ tabs }: { tabs: ArchivedTab[] }) {
  const currentTab = useCurrentTab();

  if (!currentTab) {
    return null;
  }

  const dupes = tabs.filter((t) => t.url === currentTab.url);
  const dupeCount = dupes.reduce((a, b) => a + (b.archiveCount ?? 1), 0);

  return (
    <div className="p-2">
      <h2 className="text-xl">Current Tab</h2>
      <p className="text-sm pb-2 overflow-clip max-h-full whitespace-nowrap text-ellipsis">
        {currentTab.title}
      </p>
      <button
        className={clsx(
          'btn  btn-sm',
          dupeCount > 0 ? 'btn-error' : 'btn-primary',
        )}
        onClick={async () => {
          await archiver.importTab(currentTab);
          await closeTab(currentTab.id!);
        }}
      >
        Archive{dupeCount > 0 && `d (${dupeCount} occurrences)`}
      </button>
    </div>
  );
}

function useCurrentTab() {
  const currentWindow = useAtomValue(currentWindowAtom);
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    const onActivated = async (info: chrome.tabs.TabActiveInfo) => {
      if (info.windowId !== currentWindow?.id) {
        return;
      }

      const tab = await chrome.tabs.get(info.tabId);
      setTab(tab);
    };

    getCurrentTab().then((t) => setTab(t as chrome.tabs.Tab));
    chrome.tabs.onActivated.addListener(onActivated);
    return () => chrome.tabs.onActivated.removeListener(onActivated);
  }, []);

  return tab;
}
