import { EventEmitter, ExternalEventEmitter } from '../../base/EventEmitter';
import { Tab } from '../../tabutil';

export type ArchivedTab = {
  title: string;
  url: string;
  time: number;
  archiveCount: number | undefined;
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
  private _lastValue: ArchivedTab[] | undefined = undefined;
  private _events = new EventEmitter<ArchivedTab[]>();

  get events(): ExternalEventEmitter<ArchivedTab[]> {
    return this._events;
  }

  get lastValue() {
    return this._lastValue;
  }

  async read(): Promise<ArchivedTab[]> {
    if (this.lastValue) {
      return this.lastValue.slice();
    }

    const result = (await chrome.storage.local.get(ARCHIVE_KEY)) as
      | StorageObject
      | undefined;

    const v = result?.[ARCHIVE_KEY]?.tabs || [];
    this._lastValue = v;
    return v;
  }

  private async _addTab(dedup: boolean, ...tabs: ArchivedTab[]) {
    console.log('Adding tabs', tabs);
    const archives = await this.read();
    archives.push(...tabs);
    this.write(archives);

    if (dedup) {
      console.time('dedupeTabs');
      await this.deduplicate(archives);
      console.timeEnd('dedupeTabs');
    }
  }

  private debouncedWrite = debounce(
    'writeArchivedTabs',
    () => {
      if (!this.lastValue) {
        return;
      }

      console.log('Writing archived tabs');
      chrome.storage.local.set({
        [ARCHIVE_KEY]: {
          tabs: this.lastValue,
        },
      } satisfies StorageObject);
    },
    100,
  );

  private write = (tabs: ArchivedTab[] | undefined = this.lastValue) => {
    this._lastValue = tabs;

    if (tabs) {
      setTimeout(() => {
        this._events.emit(tabs);
      }, 0);
    }

    this.debouncedWrite();
  };

  async addTab(...tabs: ArchivedTab[]) {
    await this._addTab(true, ...tabs);
  }

  async importTab(...tabs: (Tab | chrome.tabs.Tab)[]) {
    await this.addTab(
      ...tabs.map((tab) => {
        return {
          archiveCount: 1,
          importedFrom: null,
          time: Date.now(),
          title: tab.title ?? 'Unknown',
          url: tab.url ?? 'about:blank',
        };
      }),
    );
  }

  async deduplicate(tabs: ArchivedTab[]) {
    const groupedByUrl = new Map<string, ArchivedTab[]>();

    for (const tab of tabs) {
      const key = tab.url;
      const value = groupedByUrl.get(key);
      if (value) {
        value.push(tab);
      } else {
        groupedByUrl.set(key, [tab]);
      }
    }

    const duplicates = Array.from(groupedByUrl.entries())
      .filter((it) => it[1].length > 1)
      .sort(([, a], [, b]) => {
        const newestA = a.sort((a, b) => b.time - a.time)[0];
        const newestB = b.sort((a, b) => b.time - a.time)[0];
        return newestB.time - newestA.time;
      });

    const tabsToRemove = duplicates.flatMap(([, dupes]) => {
      const ranked = dupes.toSorted((tabA, tabB) => {
        if (
          tabB.title.includes('https://') &&
          !tabA.title.includes('https://')
        ) {
          return -1;
        }

        if (
          tabA.title.includes('https://') &&
          !tabB.title.includes('https://')
        ) {
          return 1;
        }

        if (tabB.importedFrom && !tabA.importedFrom) {
          return 1;
        }

        if (tabA.importedFrom && !tabB.importedFrom) {
          return -1;
        }

        return tabB.time - tabA.time;
      });

      console.log('Preserving tab:', ranked[0]);
      return {
        primary: ranked[0],
        others: ranked.slice(1),
      };
    });

    console.log('Removing tabs:', tabsToRemove);
    await this.removeTab(
      ...tabsToRemove.flatMap((it) => it.others.concat(it.primary)),
    );

    await this._addTab(
      false,
      ...tabsToRemove.map((it) => ({
        ...it.primary,
        archiveCount: (it.primary.archiveCount ?? 1) + it.others.length,
        time: Math.max(...it.others.concat(it.primary).map((it) => it.time)),
      })),
    );
  }

  async removeTab(...tabsToRemove: ArchivedTab[]) {
    const archives = await this.read();

    const corrected = archives.filter((t) => {
      for (const tab of tabsToRemove) {
        if (t.url === tab.url && t.time === tab.time && t.title === tab.title) {
          return false;
        }
      }
      return true;
    });

    this.write(corrected);
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
      this._lastValue = newValue.tabs;
      this._events.emit(newValue.tabs);
    });

    this._events.emit(await this.read());
  }
}

export const tabArchiver = new TabArchiver();

function debounce<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  delay: number,
) {
  let timeout: number | NodeJS.Timeout | undefined;

  return () => {
    if (timeout) {
      console.log('Clearing timeout', name);
      clearTimeout(timeout as number);
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      fn();
    }, delay);
  };
}
