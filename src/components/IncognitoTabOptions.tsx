import { useAtomValue } from 'jotai';
import React from 'react';
import { filteredTabGroups } from '../state/tabs';
import { selectedTabAtom } from '../state/ui';
import { ActiveTab } from '../store';
import { reopenIncognitoTab } from '../tabutil';

export function IncognitoTabOptions() {
  const activeTab = useAtomValue(selectedTabAtom);
  const tabResults = useAtomValue(filteredTabGroups);

  if (
    activeTab !== ActiveTab.Incog ||
    tabResults.state !== 'hasData' ||
    !tabResults.data.results.length
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 flex p-2 justify-center w-full">
      <button
        className="btn btn-neutral btn-sm"
        onClick={() => {
          const allTabs = tabResults.data.results.flatMap(
            (group) => group.tabs,
          );
          reopenIncognitoTab(...allTabs);
        }}
      >
        Reopen as normal tabs
      </button>
    </div>
  );
}
