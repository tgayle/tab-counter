export type Tab = chrome.tabs.Tab;
export type BrowserWindow = chrome.windows.Window;

export type TabInfo = {
  text: string;
  count: {
    normal: number;
    incognito: number;
    all: number;
  };
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

export async function focusTab(tab: Tab, switchToWindow = true): Promise<void> {
  const currentWindow = await getCurrentWindow();
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
): Promise<void> {
  await chrome.tabs.move(tab.id!, { index: -1, windowId: window.id! });

  if (shouldFocusTab) {
    await focusTab(tab);
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
    return await chrome.windows.getCurrent();
  }

  if (currentWindowId === null) {
    // TODO:
    console.warn(
      "getCurrentWindow called from background, but the currentWindowId hasn't been set yet. Falling back to chrome.windows.getCurrent(). (this may return the wrong window)",
    );
    return await chrome.windows.getCurrent();
  }

  return await chrome.windows.get(currentWindowId);
}

export async function getCurrentTab(): Promise<Tab> {
  return (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
}

export async function reopenIncognitoTab(tab: Tab): Promise<void> {
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

export async function closeTab(...tabs: Tab[]): Promise<void> {
  await chrome.tabs.remove(tabs.map((tab) => tab.id ?? -1));
}

export async function closeWindow(
  window: chrome.windows.Window,
): Promise<void> {
  await chrome.windows.remove(window.id!);
}
