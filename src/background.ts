import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from './action/TabFilter';
import {
  IPCMessages,
  TabFilterProcessor,
  TabUpdateListener,
} from './action/TabFilterProcessor';
import { setupDupeLinkMenu } from './contextmenu/listDuplicateLinks';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab, getTabInfo, setCurrentWindow } from './tabutil';

async function updateCount() {
  await chrome.action.setBadgeText({
    text: (await getTabInfo()).text,
  });
}

function main() {
  chrome.tabs.onCreated.addListener(updateCount);
  chrome.tabs.onRemoved.addListener(updateCount);
  chrome.tabs.onUpdated.addListener((_, __, tab) => updateTabContextMenu(tab));
  chrome.tabs.onActivated.addListener(async (info) =>
    chrome.tabs.get(info.tabId).then(updateTabContextMenu),
  );

  getCurrentTab().then((tab) => tab && updateTabContextMenu(tab));
  updateCount();
  setupDupeLinkMenu();

  const processor = new TabFilterProcessor({
    grouping: {
      groupBy: GroupTabsByOptions.Domain,
      sortBy: GroupSortOrder.Asc,
    },
    query: '',
    tabs: {
      sortBy: TabSortOrder.Asc,
      type: TabFilterType.All,
    },
  });

  chrome.runtime.onMessage.addListener(
    <T extends IPCMessages['msg']>(
      msg: T,
      sender: chrome.runtime.MessageSender,
      _respond: <T extends IPCMessages['key']>(
        result: Extract<IPCMessages, { msg: { type: T } }>['res'],
      ) => void,
    ) => {
      setCurrentWindow(msg.windowId!);
      const respond = (res: any) => {
        console.log('Responding to message', msg, 'with result', res);
        _respond(res);
      };

      const type = msg.type;
      switch (type) {
        case 'isLoading': {
          return respond(processor.loading);
        }
        case 'setFilters': {
          processor.filters = msg.data;
          return respond(null);
        }
        case 'setTabs': {
          processor.tabs = msg.data;
          return respond(null);
        }
        case 'submit': {
          console.log('received submit request');
          const listener: TabUpdateListener = (res) => {
            processor.removeListener(listener);
            console.log('res', res);
            respond(res);
          };
          processor.addListener(listener);
          processor.update();
          return true;
        }
      }
    },
  );
}

main();
