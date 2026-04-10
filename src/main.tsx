import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Remove splash screen after React mounts
const splash = document.getElementById('splash');
if (splash) {
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 300);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
