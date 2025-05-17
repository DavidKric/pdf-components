import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import { ContextProvider } from '@allenai/pdf-components';

import { Reader } from './components/Reader';

// Simple wrapper component to ensure we're using a single instance of React
export const AppWrapper: React.FC = () => {
  return (
    <ContextProvider>
      <BrowserRouter>
        <Route path="/" component={Reader} />
      </BrowserRouter>
    </ContextProvider>
  );
};

// This function initializes the application without using hooks directly in the top level
export const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.render(<AppWrapper />, rootElement);
  }
}; 