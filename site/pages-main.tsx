import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/della-respira/400.css';
import '@fontsource/josefin-sans/400.css';
import '@fontsource/josefin-sans/600.css';
import './app/globals.css';
import Home from './app/page';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
