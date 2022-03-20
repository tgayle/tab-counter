import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { PopupPane } from './PopupPane';

const App = () => {
  return (
    <ChakraProvider>
      <PopupPane />
    </ChakraProvider>
  );
};
export default App;
