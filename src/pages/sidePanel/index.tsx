import React from 'react';
import App from '../popup/App';
import { render } from 'react-dom';

const root = document.querySelector('#root');
render(<App sidePanel />, root);
