import { inDev } from './Features';
import { Tab } from './tabutil';

type MockTab = {
  name: string;
  url: string;
  incognito?: boolean;
  audible?: boolean;
};

const MOCK_TABS: MockTab[] = [
  {
    name: 'Chrome Web Store - Extensions',
    url: 'https://chrome.google.com/webstore/category/extensions',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
  },
  {
    name: 'Summer Vibes 2025 ⛱️ Chill Mix',
    audible: true,
    url: 'https://www.youtube.com/watch?v=aEdZsw8vptU',
  },
  {
    name: 'WWDC 2024 — June 10 | Apple',
    url: 'https://www.youtube.com/watch?v=RXeOiIDNNek',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com',
  },
  {
    name: 'X',
    url: 'https://x.com',
  },
  {
    name: 'New Tab',
    url: 'chrome://newtab/',
  },
];

export const SAMPLE_TABS: Tab[] = MOCK_TABS.map(
  (tab, i): Tab => ({
    active: false,
    title: tab.name,
    url: tab.url,
    id: i,
    highlighted: false,
    incognito: tab.incognito ?? false,
    audible: tab.audible ?? false,
    pinned: false,
    windowId: 1,
    index: i,
  }),
);
