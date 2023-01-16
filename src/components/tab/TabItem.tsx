import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import React from 'react';
import { MdMoreVert, MdOpenInNew } from 'react-icons/md';
import { currentWindowAtom } from '../../state/tabs';
import {
  closeTab,
  focusTab,
  moveTabToWindow,
  reopenIncognitoTab,
  Tab,
} from '../../tabutil';

export const TabItem: React.FC<{ tab: Tab }> = ({ tab }) => {
  const currentWindow = useAtomValue(currentWindowAtom);
  const canMoveTabToWindow =
    (currentWindow?.incognito === tab.incognito &&
      tab.windowId !== currentWindow?.id) ||
    tab.incognito;
  const canSwitchToTab = !(tab.active && tab.windowId === currentWindow?.id);

  return (
    <div className="p-2 py-1 flex flex-col items-start gap-1">
      <div className="flex w-full items-center">
        <div className="grow max-w-[80%] overflow-clip">
          <p className="truncate" title={tab.title}>
            {tab.title}
          </p>
          <p className="truncate" title={tab.url}>
            {tab.url}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-1 justify-between">
          <button
            className="p-1 btn-sm btn btn-ghost"
            disabled={!canSwitchToTab}
            onClick={() => focusTab(tab)}
          >
            <MdOpenInNew size={20} />
          </button>

          <div className="dropdown dropdown-end">
            <button className="p-1 btn btn-ghost btn-sm" tabIndex={0}>
              <MdMoreVert size={20} />
            </button>

            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48"
            >
              <li
                className={clsx(!canSwitchToTab && 'disabled')}
                onClick={() => focusTab(tab)}
              >
                <a>Switch to tab</a>
              </li>
              <li
                className={clsx(!canMoveTabToWindow && 'disabled')}
                onClick={() =>
                  currentWindow && moveTabToWindow(tab, currentWindow)
                }
              >
                <a> Move tab to this window</a>
              </li>
              {tab.incognito && (
                <li onClick={() => reopenIncognitoTab(tab)}>
                  <a>Reopen in normal window</a>
                </li>
              )}
              <li onClick={() => closeTab(tab)}>
                <a>Close</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        {tab.audible && <div className="badge badge-success">Audible</div>}
        {tab.mutedInfo?.muted && <div className="badge badge-error">Muted</div>}
        {tab.incognito && <div className="badge ">Incognito</div>}
        {tab.discarded && <div className="badge badge-info">Suspended</div>}
      </div>
    </div>
  );
};
