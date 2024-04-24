import { atom, useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { ArchivedTab, TabArchiver } from './TabArchiver';
import { tabFilterAtom } from '../../state/settings';
import { GroupSortOrder } from '../../action/TabFilter';

const archiver = new TabArchiver();
const archivedTabsAtom = atom<ArchivedTab[]>([]);

archivedTabsAtom.onMount = (set) => {
  archiver.init();
  return archiver.events.addListener((value) => {
    console.log(value);
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
    return tabs
      .slice()
      .filter((tab) => {
        return (
          tab.title.toLowerCase().includes(query.toLowerCase()) ||
          tab.url.toLowerCase().includes(query.toLowerCase()) ||
          (tab.importedFrom &&
            (tab.importedFrom.title
              .toLowerCase()
              .includes(query.toLowerCase()) ||
              tab.importedFrom.url.toLowerCase().includes(query.toLowerCase())))
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case GroupSortOrder.Asc:
            return a.time - b.time;
          case GroupSortOrder.Desc:
            return b.time - a.time;
          case GroupSortOrder.Count:
            return 0;
        }
      });
  }, [sortBy, tabs, query]);

  return (
    <div>
      <div className="divide-y">
        {sortedTabs.map((tab, i) => (
          <ArchivedTabItem tab={tab} key={i} />
        ))}
      </div>
    </div>
  );
}

function ArchivedTabItem({ tab }: { tab: ArchivedTab }) {
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
      <p>{new Date(tab.time).toLocaleString()}</p>
    </div>
  );
}
