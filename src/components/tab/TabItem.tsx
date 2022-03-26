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
  useOutsideClick,
} from '@chakra-ui/react';
import React, { useContext, useRef } from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { BrowserWindow, focusTab, moveTabToWindow, Tab } from '../../tabutil';

type TabItemMenuContextType = {
  tab: Tab | null;
  openTabMenu: (tab: Tab | null) => void;
};

export const TabItemMenuContext = React.createContext<TabItemMenuContextType>({
  tab: null,
  openTabMenu: () => {},
});

export const TabItem = ({
  tab,
  currentWindow,
}: {
  tab: Tab;
  currentWindow: BrowserWindow | null;
}) => {
  const canMoveTabToWindow =
    currentWindow?.incognito === tab.incognito &&
    tab.windowId !== currentWindow?.id;
  const canSwitchToTab = !(tab.active && tab.windowId === currentWindow?.id);

  const menuContext = useContext(TabItemMenuContext);
  const menuOpen = menuContext.tab === tab;
  const menuRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick({
    ref: menuRef,
    handler: () => menuContext.openTabMenu(null),
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
            isDisabled={!canSwitchToTab}
            onClick={() => focusTab(tab)}
            onContextMenu={(e) => {
              if (e.ctrlKey || !canSwitchToTab) return;
              e.preventDefault();
              menuContext.openTabMenu(tab);
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
