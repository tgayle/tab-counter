import {
  VStack,
  Flex,
  Box,
  Spacer,
  IconButton,
  HStack,
  Badge,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import React, { useRef } from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useStore } from '../../store';
import {
  closeTab,
  focusTab,
  moveTabToWindow,
  reopenIncognitoTab,
  Tab,
} from '../../tabutil';

export const TabItem = ({ tab }: { tab: Tab }) => {
  const currentWindow = useStore(({ state }) => state.currentWindow);
  const canMoveTabToWindow =
    (currentWindow?.incognito === tab.incognito &&
      tab.windowId !== currentWindow?.id) ||
    tab.incognito;
  const canSwitchToTab = !(tab.active && tab.windowId === currentWindow?.id);
  const buttonEnabled = canSwitchToTab || canMoveTabToWindow;

  const activeTabMenu = useStore(({ ui }) => ui.focusedTabMenu);
  const openTabMenu = useStore(({ ui }) => ui.setFocusedTab);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuOpen = activeTabMenu === tab;
  useContextMenu({
    menuRef,
    enabled: buttonEnabled,
    onOpen: () => openTabMenu(tab),
    onClose: () => openTabMenu(null),
    buttonRef: menuButtonRef,
  });

  return (
    <VStack alignItems="start" py={1}>
      <Flex alignItems="center" w="full">
        <Box width="85%">
          <Text noOfLines={1} title={tab.title}>
            {tab.title}
          </Text>
          <Text noOfLines={1} title={tab.url}>
            {tab.url}
          </Text>
        </Box>
        <Spacer />
        <Menu isOpen={menuOpen}>
          <MenuButton
            as={IconButton}
            size="sm"
            title="Switch to tab"
            aria-label="Switch to tab"
            icon={<MdOpenInNew />}
            ref={menuButtonRef}
            isDisabled={!buttonEnabled}
            onClick={(e) => {
              if (tab.active && tab.windowId === currentWindow?.id) {
                e.preventDefault();
                openTabMenu(tab);
              } else {
                focusTab(tab);
              }
            }}
          />
          <MenuList ref={menuRef}>
            <MenuItem
              isDisabled={!canSwitchToTab}
              onClick={() => focusTab(tab)}
            >
              Switch to tab
            </MenuItem>
            <MenuItem
              isDisabled={!canMoveTabToWindow}
              onClick={() =>
                currentWindow && moveTabToWindow(tab, currentWindow)
              }
            >
              Move tab to this window
            </MenuItem>
            {tab.incognito && (
              <MenuItem onClick={() => reopenIncognitoTab(tab)}>
                Reopen in normal window
              </MenuItem>
            )}
            <MenuItem onClick={() => closeTab(tab)}>Close</MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <HStack>
        {tab.audible && <Badge colorScheme="green">Audible</Badge>}
        {tab.mutedInfo?.muted && <Badge colorScheme="red">Muted</Badge>}
        {tab.incognito && <Badge colorScheme="blackAlpha">Incognito</Badge>}
        {tab.discarded && <Badge colorScheme="blue">Suspended</Badge>}
      </HStack>
    </VStack>
  );
};
