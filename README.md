# Tab Counter

A browser extension for counting and searching your open tabs/windows.

**Why?:** I have a bad habit of not closing tabs, and I thought it would be nice if I could filter these tabs a little better.

### Features:
- [x] Searching Tabs
- [x] Filtering Tabs
  - [x] Duplicate Tabs
  - [x] Audible Tabs
  - [x] Current Window
- [x] Grouping Tabs
  - [x] by domain/origin
  - [x] by window
- [x] Sorting Tabs
  - [x] by number of tabs in group
  - [x] alphabetically
- [x] Tab Interactions
  - [x] Close Tab
  - [x] Move tab to current window
  - [x] Jump to tab
- [ ] Firefox Support


### Development

For development with automatic reloading:

```sh
npm run start
```

Open the [Extensions Dashboard](chrome://extensions), enable "Developer mode", click "Load unpacked", and choose the `dist` folder.

When you make changes in `src` the background script and any content script will reload automatically.
