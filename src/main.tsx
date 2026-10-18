import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update for offline and mobile installation
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
