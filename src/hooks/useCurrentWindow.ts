import { useEffect, useState } from 'react';
import { BrowserWindow, getCurrentWindow } from '../tabutil';

export function useCurrentWindow() {
  const [window, setWindow] = useState<BrowserWindow | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const currentWindow = await getCurrentWindow();
      if (!active) return;
      setWindow(currentWindow);
    })();

    return () => {
      active = false;
    };
  }, []);

  return window;
}
