import React from 'react';
import App from './App';
import { createRoot } from 'react-dom/client';

console.log('popup script');
const root = document.querySelector('#root');
createRoot(root!).render(<App />);
