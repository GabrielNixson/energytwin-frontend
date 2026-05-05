import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/main.scss';
import App from './App';
import './tracing'

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

// Debug logs (optional)
console.log("🚀 Sentry initialization attempt with DSN:", import.meta.env.VITE_SENTRY_DSN);

if (Sentry.getClient()) {
  console.log("✅ Sentry connected and active.");
} else {
  console.error("❌ Sentry failed to initialize.");
}

// Set default theme for standalone testing
document.documentElement.setAttribute('data-theme', 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
