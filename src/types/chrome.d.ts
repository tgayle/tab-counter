declare namespace chrome.action {
  // Not available in Chrome 99
  // https://github.com/GoogleChrome/developer.chrome.com/issues/204
  function openPopup(args?: { windowId?: number }): Promise<void>;
}
