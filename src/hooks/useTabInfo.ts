import { useState, useEffect } from 'react';
import { TabInfo, getTabInfo } from '../tabutil';

type UseTabInfoResult = { loading: boolean; tabs: TabInfo['tabs'] };

export function useTabInfo(): UseTabInfoResult {
  const [tabs, setTabs] = useState<TabInfo['tabs']>({
    all: [],
    incognito: [],
    normal: [],
  });
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

  return {
    loading,
    tabs,
  };
}
