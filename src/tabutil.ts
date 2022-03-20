export type Tab = chrome.tabs.Tab;

export type TabInfo = {
  text: string;
  tabs: {
    normal: chrome.tabs.Tab[];
    incognito: chrome.tabs.Tab[];
    all: chrome.tabs.Tab[];
  };
};

export async function getTabInfo(): Promise<TabInfo> {
  const tabs = await chrome.tabs.query({});
  const incognitoTabs = tabs.filter((tab) => tab.incognito);
  const normalTabs = tabs.filter((tab) => !tab.incognito);

  const text = `${normalTabs.length}${
    incognitoTabs.length ? '/' + incognitoTabs.length : ''
  }`;

  return {
    text,
    tabs: {
      normal: normalTabs,
      incognito: incognitoTabs,
      all: tabs,
    },
  };
}

type TabStats = {
  audible: Tab[];
  muted: Tab[];
};

export function getTabsStats(tabs: Tab[]): TabStats {
  const audible: Tab[] = [];
  const muted: Tab[] = [];

  for (const tab of tabs) {
    if (tab.audible) {
      audible.push(tab);
    }

    if (tab.mutedInfo?.muted) {
      muted.push(tab);
    }
  }

  return {
    audible,
    muted,
  };
}

export async function focusTab(tab: Tab, switchToWindow: boolean = true) {
  const currentWindow = await chrome.windows.getCurrent();
  await chrome.tabs.update(tab.id!, { active: true });
  if (switchToWindow && currentWindow.id !== tab.windowId) {
    await chrome.windows.update(tab.windowId, {
      focused: true,
    });
  }
}
