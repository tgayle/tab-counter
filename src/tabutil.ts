import browser from 'webextension-polyfill';
export type Tab = browser.Tabs.Tab & { groupId?: number };
export type BrowserWindow = browser.Windows.Window;

export type TabInfo = {
  text: string;
  count: {
    normal: number;
    incognito: number;
    all: number;
  };
  tabs: {
    normal: Tab[];
    incognito: Tab[];
    all: Tab[];
  };
};

export async function getTabInfo(): Promise<TabInfo> {
  const tabs = await browser.tabs.query({});
  const incognitoTabs = tabs.filter((tab) => tab.incognito);
  const normalTabs = tabs.filter((tab) => !tab.incognito);

  const text = `${normalTabs.length}${
    incognitoTabs.length ? '/' + incognitoTabs.length : ''
  }`;

  return {
    text,
    count: {
      all: tabs.length,
      incognito: incognitoTabs.length,
      normal: normalTabs.length,
    },
    tabs: {
      normal: normalTabs,
      incognito: incognitoTabs,
      all: tabs,
    },
  };
}

export async function focusTab(
  tab: Tab | number,
  switchToWindow = true,
): Promise<void> {
  const currentWindow = await getCurrentWindow();

  if (typeof tab === 'number') {
    tab = await browser.tabs.get(tab);
  }

  await browser.tabs.update(tab.id!, { active: true });
  if (switchToWindow && currentWindow.id !== tab.windowId) {
    await focusWindow(tab.windowId!);
  }
}

export async function focusWindow(
  window: BrowserWindow | number,
): Promise<void> {
  if (typeof window === 'number') {
    window = await browser.windows.get(window);
  }

  await browser.windows.update(window.id!, { focused: true });
}

export async function moveTabToWindow(
  tab: Tab | Tab[],
  window: BrowserWindow,
  shouldFocusTab = true,
): Promise<void> {
  const ids = Array.isArray(tab) ? tab.map((t) => t.id!) : [tab.id!];
  await browser.tabs.move(ids, { index: -1, windowId: window.id! });

  if (shouldFocusTab) {
    if (Array.isArray(tab)) {
      await focusWindow(window);
    } else {
      await focusTab(tab);
    }
  }
}

let currentWindowId: number | null = null;

export function setCurrentWindow(id: number | null): void {
  if (typeof window !== 'undefined')
    throw new Error('dont call this from popup context.');
  currentWindowId = id;
}

export async function getCurrentWindow(): Promise<BrowserWindow> {
  if (typeof window !== 'undefined') {
    return await browser.windows.getCurrent();
  }

  if (currentWindowId === null) {
    // TODO:
    console.warn(
      "getCurrentWindow called from background, but the currentWindowId hasn't been set yet. Falling back to chrome.windows.getCurrent(). (this may return the wrong window)",
    );
    return await browser.windows.getCurrent();
  }

  return await browser.windows.get(currentWindowId);
}

export async function getCurrentTab(): Promise<Tab> {
  return (await browser.tabs.query({ active: true, currentWindow: true }))[0];
}

export async function reopenIncognitoTab(...tabs: Tab[]): Promise<void> {
  const currentWindow = await getCurrentWindow();

  const targetWindow: BrowserWindow | null = await (async () => {
    if (tabs.length === 1) {
      if (!currentWindow.incognito) {
        return currentWindow;
      } else {
        const window = await browser.windows.getLastFocused({
          // @ts-expect-error Not declared but both MDN and Chrome docs document this API
          windowTypes: ['normal'],
        });

        if (window.incognito) {
          return null;
        }
      }
    }

    return null;
  })();

  const tabUrls = tabs
    .map((tab) => tab.url)
    .filter((url): url is string => !!url);

  // For some reason, if we try to close the original tabs after opening the new ones,
  // the original tabs won't be removed. (post-migration to webextension-polyfill)
  if (!targetWindow) {
    await browser.windows.create({
      focused: true,
      incognito: false,
      url: tabUrls,
    });
  } else {
    const allTabs = tabUrls.map((url) =>
      browser.tabs.create({
        url,
        windowId: targetWindow.id,
      }),
    );
    await Promise.all(allTabs);
    await browser.windows.update(targetWindow.id!, { focused: true });
  }
  await closeTab(...tabs);
}

export async function closeTab(...tabs: (Tab | number)[]): Promise<void> {
  const ids = tabs.map((tab) => (typeof tab === 'number' ? tab : tab.id ?? -1));
  await browser.tabs.remove(Array.from(new Set(ids)));
}

export async function closeWindow(window: BrowserWindow): Promise<void> {
  await browser.windows.remove(window.id!);
}

export async function getAllWindows() {
  return await browser.windows.getAll();
}

export function canTabMoveToWindow(tab: Tab, window: BrowserWindow | null) {
  return window?.incognito === tab.incognito && tab.windowId !== window?.id;
}

export async function createTabGroup(
  name: string,
  tabs: Tab[],
  window: BrowserWindow | null,
  group: chrome.tabGroups.TabGroup | null,
) {
  window ||= await getCurrentWindow();

  const groupId = await chrome.tabs.group({
    createProperties: {
      windowId: window.id,
    },
    groupId: group?.id,
    tabIds: tabs
      .filter((tab) =>
        group ? group.id !== (tab as chrome.tabs.Tab).groupId : true,
      )
      .map((tab) => tab.id)
      .filter((id): id is number => id !== undefined),
  });

  return await chrome.tabGroups.update(groupId, {
    title: name,
    collapsed: true,
  });
}

export function partition<T>(
  items: T[],
  condition: (item: T) => boolean,
): [T[], T[]] {
  const trueItems: T[] = [];
  const falseItems: T[] = [];
  for (const item of items) {
    if (condition(item)) {
      trueItems.push(item);
    } else {
      falseItems.push(item);
    }
  }
  return [trueItems, falseItems];
}
