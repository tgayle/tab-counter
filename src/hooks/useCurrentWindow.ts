import { useEffect, useState } from 'react';

export function useCurrentWindow() {
  const [window, setWindow] = useState<chrome.windows.Window | null>(null);

  useEffect(() => {
    (async () => {
      const currentWindow = await chrome.windows.getCurrent();
      setWindow(currentWindow);
    })();
  }, []);

  return window;
}
