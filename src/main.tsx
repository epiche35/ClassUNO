import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import logo and set it as the browser favicon dynamically
import logoUrl from './assets/images/logo.png';

const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
link.type = 'image/png';
link.rel = 'icon';
link.href = logoUrl;
document.head.appendChild(link);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);