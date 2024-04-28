import { closeTab } from '../../tabutil';
import { TabArchiver } from './TabArchiver';

const archiver = new TabArchiver();

export async function configureTabArchiving() {
  await archiver.init();

  chrome.contextMenus.create({
    id: 'archive-link',
    title: 'Archive Link',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'archive-tab',
    title: 'Archive Tab',
    contexts: ['page'],
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
      case 'archive-link':
        if (!info.linkUrl) {
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
        return;
      case 'archive-tab':
        console.log('Requested to archive tab', info, tab);

        if (!tab || !tab.url || !tab.id) return;

        await archiver.addTab({
          importedFrom: null,
          time: Date.now(),
          title: tab?.title ?? 'Unknown',
          url: tab?.url ?? 'about:blank',
        });

        await closeTab(tab.id);
        return;
    }
  });
}
