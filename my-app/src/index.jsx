// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Must match your file name (App.jsx or App.js)
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);