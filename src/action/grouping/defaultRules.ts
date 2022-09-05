import { Rule } from './TabGrouper';
export const defaultRules: Rule[] = [
  {
    id: 'default_chrome_extension',
    displayName: 'Chrome',
    origin: 'chrome://extensions',
    pathname: null,
    queryParams: [],
  },
  {
    id: 'default_chrome_newtab',
    displayName: 'New Tab',
    origin: 'chrome://newtab',
    pathname: null,
    queryParams: [],
  },
  {
    id: 'default_chrome_extensions',
    displayName: 'Chrome Extensions',
    origin: 'chrome-extension://',
    pathname: null,
    queryParams: [],
  },
  {
    id: 'default_youtube_video',
    displayName: 'YouTube Videos',
    origin: 'https://www.youtube.com',
    pathname: '/watch',
    queryParams: ['v'],
  },
  {
    id: 'default_youtube_channel',
    displayName: 'YouTube Channels',
    origin: 'https://www.youtube.com',
    pathname: '/c',
    queryParams: [],
  },
];
