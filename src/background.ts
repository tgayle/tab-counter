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
import settings from './settings';
import { getCurrentTab, getTabInfo, setCurrentWindow } from './tabutil';

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
        case 'getCurrent': {
          if (processor.results) {
            return respond(processor.results);
          } else {
            processor.update().then((res) => {
              respond(res);
            });
            return true;
          }
        }
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
        case 'setSearchQuery': {
          processor.filters = {
            ...processor.filters,
            query: msg.data,
          };
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

  await settings.loaded;
  const currentSettings = settings.current;
  processor.filters = {
    grouping: {
      groupBy: currentSettings.tabGrouping,
      sortBy: currentSettings.groupSortBy,
    },
    query: processor.filters.query,
    tabs: {
      sortBy: currentSettings.tabSortBy,
      type: currentSettings.tabFilterType,
    },
  };

  const {
    tabs: { all: allTabs },
  } = await getTabInfo();
  processor.tabs = allTabs;
  await processor.update();
}

main();
