import React from 'react';
import { useAtomValue } from 'jotai';
import { TabFilterType } from '../action/TabFilter';
import { tabFilterAtom } from '../state/settings';
import { filteredTabGroups } from '../state/tabs';

export function DeduplicateTabButton() {
  const filters = useAtomValue(tabFilterAtom);
  const groupAtom = useAtomValue(filteredTabGroups);

  if (
    groupAtom.state !== 'hasData' ||
    filters.tabs.type !== TabFilterType.Duplicates ||
    groupAtom.data.results.length === 0
  )
    return null;

  const dedupe = () => {
    const tabGroups = groupAtom.data;

    const tabsToClose = tabGroups.results
      .map((group) => {
        console.log(`Group: ${group.displayName}`, group.tabs);
        return group.tabs.slice(1);
      })
      .flat();

    const tabIds = tabsToClose
      .map((tab) => tab.id)
      .filter((it): it is number => !!it);

    chrome.tabs.remove(tabIds);
  };

  return (
    <div className="flex justify-center">
      <span
        className="tooltip tooltip-bottom"
        data-tip="Close all but one of each duplicate tab"
      >
        <button className="btn btn-sm" onClick={dedupe}>
          Dedupe Tabs
        </button>
      </span>
    </div>
  );
}
