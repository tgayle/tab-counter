import { useOutsideClick } from '@chakra-ui/react';
import { RefObject, useEffect } from 'react';

export function useContextMenu({
  menuRef,
  onClose,
  onOpen,
  enabled,
  buttonRef,
}: {
  menuRef: RefObject<HTMLElement>;
  buttonRef: RefObject<HTMLElement>;
  enabled: boolean;
  onOpen: () => void;
  onClose: () => void;
}): void {
  useOutsideClick({
    ref: menuRef,
    handler: onClose,
  });

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const onRightClick = (e: MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      onOpen();
    };

    button.addEventListener('contextmenu', onRightClick);
    return () => button.removeEventListener('contextmenu', onRightClick);
  }, [buttonRef.current, enabled]);

  useEffect(() => {
    if (!enabled) onClose();
  }, [enabled]);
}
