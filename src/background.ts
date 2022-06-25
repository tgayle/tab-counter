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
import { setupBadgeCount } from './badge';
import { setupDupeLinkMenu } from './contextmenu/listDuplicateLinks';
import { updateTabContextMenu } from './contextmenu/listDuplicateTabs';
import { getCurrentTab, setCurrentWindow } from './tabutil';

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

async function main() {
  chrome.tabs.onUpdated.addListener(async (_, __, tab) => {
    updateTabContextMenu(tab);
  });

  chrome.tabs.onActivated.addListener(async (info) =>
    chrome.tabs.get(info.tabId).then(updateTabContextMenu),
  );

  getCurrentTab().then((tab) => tab && updateTabContextMenu(tab));
  setupDupeLinkMenu();
  setupBadgeCount();

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
        case 'execute': {
          processor.tabs = msg.data.targetTabs;
          processor.filters = msg.data.filters;
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
      return false;
    },
  );
}

main();
