import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { TabArchiver } from './TabArchiver';
import { getCurrentTab } from '../../tabutil';

const archiver = new TabArchiver();

export function ArchivedTabDropZone() {
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const onStart = (e: DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    };

    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      setDragActive(false);

      const contents = [e.dataTransfer.getData('text/plain')];

      (async () => {
        const currentTab = await getCurrentTab();
        for (const value of await Promise.all(contents)) {
          if (!value) continue;

          const url = new URL(value);
          await archiver.addTab({
            importedFrom:
              currentTab.title && currentTab.url
                ? {
                    title: currentTab.title,
                    url: currentTab.url,
                  }
                : null,
            time: Date.now(),
            title: url.href,
            url: url.href,
          });
        }
      })();
    };

    const onExit = (e: DragEvent) => {
      if (!e.relatedTarget && dragActive) {
        // we've left the window
        setDragActive(false);
      }
    };

    const onEnter = (e: DragEvent) => {
      return e.preventDefault();
    };

    document.body.addEventListener('dragenter', onEnter);
    document.body.addEventListener('dragover', onStart);
    document.body.addEventListener('drop', onDrop);
    document.body.addEventListener('dragleave', onExit);

    return () => {
      document.body.removeEventListener('dragenter', onEnter);
      document.body.removeEventListener('dragover', onStart);
      document.body.removeEventListener('drop', onDrop);
      document.body.removeEventListener('dragleave', onExit);
    };
  }, [dragActive]);

  return (
    <div
      className={clsx(
        'z-50 bg-blue-600 absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-opacity-80 text-white transition-opacity duration-300',
        !dragActive && 'opacity-0 pointer-events-none',
      )}
    >
      <p className="text-xl pointer-events-none">Drop to archive</p>
    </div>
  );
}
