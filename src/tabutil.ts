export type Tab = chrome.tabs.Tab;
export type BrowserWindow = chrome.windows.Window;

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

export type TabStats = {
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

export async function moveTabToWindow(
  tab: Tab,
  window: chrome.windows.Window,
  shouldFocusTab = true,
) {
  await chrome.tabs.move(tab.id!, { index: -1, windowId: window.id! });

  if (shouldFocusTab) {
    await focusTab(tab);
  }
}

export async function getCurrentWindow() {
  return await chrome.windows.getCurrent();
}

export async function getCurrentTab() {
  return (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
}

export async function reopenIncognitoTab(tab: Tab) {
  const currentWindow = await getCurrentWindow();
  const normalWindow = !currentWindow.incognito
    ? currentWindow
    : (await chrome.windows.getAll()).find((window) => !window.incognito);

  if (!normalWindow) {
    await chrome.windows.create({
      focused: true,
      incognito: false,
      url: tab.url,
    });
  } else {
    await chrome.tabs.create({
      url: tab.url,
      active: true,
      windowId: normalWindow.id,
    });
  }

  await chrome.tabs.remove(tab.id!);
}

export async function closeTab(tab: Tab) {
  await chrome.tabs.remove(tab.id!);
}

export enum DuplicatePolicy {
  Exact,
  BasePath,
  Presets,
}

const presetDuplicateResolvers: Record<
  string,
  (url1: URL, url2: URL) => boolean
> = {
  'https://www.youtube.com/watch': (url1, url2) => {
    return url1.searchParams.get('v') === url2.searchParams.get('v');
  },
  'https://www.google.com/search': (url1, url2) => {
    return url1.searchParams.get('q') === url2.searchParams.get('q');
  },
};

export async function findDuplicateTabs(
  tabOrUrl: Tab | string,
  duplicatePolicy: DuplicatePolicy = DuplicatePolicy.Presets,
) {
  const allTabs = await getTabInfo();

  const currentUrl = new URL(
    typeof tabOrUrl === 'string' ? tabOrUrl : tabOrUrl.url!,
  );
  const fullUrl = currentUrl.origin + currentUrl.pathname;

  const dupes = allTabs.tabs.all.filter((tab) => {
    const tabUrl = new URL(tab.url!);
    const tabFullUrl = tabUrl.origin + tabUrl.pathname;
    const sameBaseBath = fullUrl === tabFullUrl;

    switch (duplicatePolicy) {
      case DuplicatePolicy.BasePath: {
        return sameBaseBath;
      }
      case DuplicatePolicy.Exact: {
        return tabUrl.href === currentUrl.href;
      }
      case DuplicatePolicy.Presets: {
        if (sameBaseBath && presetDuplicateResolvers[fullUrl]) {
          return presetDuplicateResolvers[fullUrl](currentUrl, tabUrl);
        }

        return sameBaseBath;
      }
    }
  });

  return dupes;
}
