// Right clicking on a link will show duplicate tabs
// Chrome says this should be available in V99+, but
// it's not found for me.
// https://github.com/GoogleChrome/developer.chrome.com/issues/204
export async function setupDupeLinkMenu() {
  if (!chrome.action.openPopup) {
    console.warn(
      "openPopup() not found, you won't be able to search for duplicate tabs by links",
    );
    return;
  }
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== 'link_dupe_menu') return;
    console.log(info);
    await chrome.action.openPopup();
    chrome.runtime.sendMessage({
      search: info.linkUrl,
    });
  });

  chrome.contextMenus.create({
    id: 'link_dupe_menu',
    title: 'Find Duplicate Tabs',
    contexts: ['link'],
  });
}
