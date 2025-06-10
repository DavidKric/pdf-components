/**
 * This is the main entry point for the UI. You should not need to make any
 * changes here.
 */

import { ContextProvider } from '@allenai/pdf-components';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import PaperList from './pages/PaperList';
import { Reader } from './pages/Reader';

const App = () => {
  return (
    <ContextProvider>
      <BrowserRouter basename="/reader">
        <Switch>
          <Route path="/:corpusId" component={Reader} />
          <Route path="/" component={PaperList} />
        </Switch>
      </BrowserRouter>
    </ContextProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
