import { useState, useEffect } from 'react';
import { TabInfo, getTabInfo } from '../tabutil';

type UseTabInfoResult =
  | { loading: false; tabs: TabInfo['tabs'] }
  | { loading: true; tabs: undefined };

export function useTabInfo(): UseTabInfoResult {
  const [tabs, setTabs] = useState<TabInfo['tabs']>();
  const [loading, setLoading] = useState(true);

  const updateTabs = async () => {
    const { tabs: currentTabs } = await getTabInfo();
    setTabs(currentTabs);
    setLoading(false);
  };

  useEffect(() => {
    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);
    updateTabs();
    return () => {
      chrome.tabs.onCreated.removeListener(updateTabs);
      chrome.tabs.onRemoved.removeListener(updateTabs);
      chrome.tabs.onUpdated.addListener(updateTabs);
    };
  }, []);

  if (loading === false && tabs) {
    return {
      loading: false,
      tabs,
    };
  }

  return {
    loading: true,
    tabs: undefined,
  };
}
