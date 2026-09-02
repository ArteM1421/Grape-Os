import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import TextView from './TextView.tsx';
import './index.css';

const path = window.location.pathname;

if (path === '/text' || path === '/text/') {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <TextView />
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
