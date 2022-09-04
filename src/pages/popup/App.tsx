import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { PopupPane } from './PopupPane';
import './index.css';

const App = () => {
  return (
    <ChakraProvider>
      <PopupPane />
    </ChakraProvider>
  );
};
export default App;
