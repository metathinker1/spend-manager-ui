import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { createQueryClient } from './api/queryClient';
import { App } from './App';
import { Providers } from './app/Providers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers client={createQueryClient()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
