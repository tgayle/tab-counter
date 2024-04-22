import clsx from 'clsx';
import { useAtomValue, useSetAtom } from 'jotai';
import React from 'react';
import { MdMoreVert, MdOpenInNew } from 'react-icons/md';
import { currentWindowAtom } from '../../state/tabs';
import { selectedTabAtom } from '../../state/ui';
import { ActiveTab } from '../../store';
import {
  canTabMoveToWindow,
  closeTab,
  focusTab,
  moveTabToWindow,
  reopenIncognitoTab,
  Tab,
} from '../../tabutil';
import { editingRuleState, getNewRuleFromTab } from '../rules/EditRuleDisplay';

export enum TabItemActions {
  SwitchToTab,
  MoveTabToWindow,
  ReopenInNormalWindow,
  CreateRuleFromTab,
  CloseTab,
}

export const TabItem: React.FC<{
  tab: Tab;
  hiddenOptions?: TabItemActions[];
}> = ({ tab, hiddenOptions: disabledOptions }) => {
  const currentWindow = useAtomValue(currentWindowAtom);
  const canMoveTabToWindow =
    canTabMoveToWindow(tab, currentWindow) || tab.incognito;
  const canSwitchToTab = !(tab.active && tab.windowId === currentWindow?.id);
  const setActiveTab = useSetAtom(selectedTabAtom);
  const setEditingRuleState = useSetAtom(editingRuleState);

  return (
    <div className="p-2 py-1 flex flex-col items-start gap-1 bg-white">
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
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-[1]"
            >
              <Show type={TabItemActions.SwitchToTab}>
                <li
                  className={clsx(!canSwitchToTab && 'disabled')}
                  onClick={() => focusTab(tab)}
                >
                  <a>Switch to tab</a>
                </li>
              </Show>
              <Show type={TabItemActions.MoveTabToWindow}>
                <li
                  className={clsx(!canMoveTabToWindow && 'disabled')}
                  onClick={() =>
                    currentWindow && moveTabToWindow(tab, currentWindow)
                  }
                >
                  <a> Move tab to this window</a>
                </li>
              </Show>
              {tab.incognito && (
                <Show type={TabItemActions.ReopenInNormalWindow}>
                  <li onClick={() => reopenIncognitoTab(tab)}>
                    <a>Reopen in normal window</a>
                  </li>
                </Show>
              )}

              <Show type={TabItemActions.CreateRuleFromTab}>
                <li
                  onClick={() => {
                    setActiveTab(ActiveTab.Tools);
                    setEditingRuleState({
                      rule: getNewRuleFromTab(tab),
                    });
                  }}
                >
                  <a>Create rule from tab</a>
                </li>
              </Show>

              <Show type={TabItemActions.CloseTab}>
                <li onClick={() => closeTab(tab)}>
                  <a>Close</a>
                </li>
              </Show>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        {tab.audible && <div className="badge badge-success">Audible</div>}
        {tab.mutedInfo?.muted && <div className="badge badge-error">Muted</div>}
        {tab.incognito && <div className="badge badge-neutral ">Incognito</div>}
        {tab.discarded && <div className="badge badge-info">Suspended</div>}
      </div>
    </div>
  );

  function Show({
    type,
    children,
  }: {
    type: TabItemActions;
    children: React.ReactElement;
  }) {
    if (disabledOptions?.includes(type)) {
      return null;
    }

    return children;
  }
};

export function dropdownItemHandler<T extends React.SyntheticEvent>(
  action: (event: T) => any | Promise<any>,
) {
  return async (event: T) => {
    await action(event);
    (document.activeElement as HTMLElement | null)?.blur();
  };
}
