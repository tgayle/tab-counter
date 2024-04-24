import { EventEmitter, ExternalEventEmitter } from '../../base/EventEmitter';

export type ArchivedTab = {
  title: string;
  url: string;
  time: number;
  importedFrom: {
    title: string;
    url: string;
  } | null;
};

type PersistedArchives = {
  tabs: ArchivedTab[];
};

const ARCHIVE_KEY = 'archived-tabs';

type StorageObject = {
  [ARCHIVE_KEY]?: PersistedArchives;
};

export class TabArchiver {
  private _events = new EventEmitter<ArchivedTab[]>();

  get events(): ExternalEventEmitter<ArchivedTab[]> {
    return this._events;
  }

  async read(): Promise<ArchivedTab[]> {
    const result = (await chrome.storage.local.get(ARCHIVE_KEY)) as
      | StorageObject
      | undefined;
    return result?.[ARCHIVE_KEY]?.tabs || [];
  }

  async addTab(...tabs: ArchivedTab[]) {
    console.log('Adding tabs', tabs);
    const archives = await this.read();
    archives.push(...tabs);
    await chrome.storage.local.set({
      [ARCHIVE_KEY]: {
        tabs: archives,
      },
    } satisfies StorageObject);
  }

  async removeTab(tab: ArchivedTab) {
    const archives = await this.read();
    const index = archives.findIndex(
      (t) => t.url === tab.url && t.time === tab.time,
    );
    if (index === -1) {
      return;
    }

    archives.splice(index, 1);
    await chrome.storage.local.set({
      [ARCHIVE_KEY]: {
        tabs: archives,
      },
    } satisfies StorageObject);
  }

  async init() {
    chrome.storage.local.onChanged.addListener((changes) => {
      console.log('Storage changed:', changes);
      if (!(ARCHIVE_KEY in changes)) {
        return;
      }

      const change = changes[ARCHIVE_KEY];
      console.log('Archived tabs changed:', change);
      const newValue: PersistedArchives = change.newValue || { tabs: [] };
      this._events.emit(newValue.tabs);
    });

    this._events.emit(await this.read());
  }
}

export const tabArchiver = new TabArchiver();
