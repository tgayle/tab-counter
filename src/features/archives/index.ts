import { TabArchiver } from './TabArchiver';

const archiver = new TabArchiver();

export async function configureTabArchiving() {
  await archiver.init();

  chrome.contextMenus.create({
    id: 'archive-tab',
    title: 'Archive Tab',
    contexts: ['link'],
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== 'archive-tab' || !info.linkUrl) {
      return;
    }

    console.log('Requested to archive link', info, info.linkUrl);

    await archiver.addTab({
      importedFrom:
        tab?.title && tab.url ? { title: tab.title, url: tab.url } : null,
      time: Date.now(),
      title: info.linkUrl,
      url: info.linkUrl,
    });
  });
}
