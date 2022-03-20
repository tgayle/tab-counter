import {
  VStack,
  Flex,
  Box,
  Spacer,
  IconButton,
  HStack,
  Badge,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { focusTab, Tab } from '../../tabutil';

export const TabItem = ({ tab }: { tab: Tab }) => {
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
        <IconButton
          size="sm"
          aria-label="Switch to tab"
          icon={<MdOpenInNew />}
          onClick={() => focusTab(tab)}
        />
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
