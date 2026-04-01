import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#F5F5F5',
              border: '1px solid #2D2D2D',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#34C759', secondary: '#1A1A1A' } },
            error: { iconTheme: { primary: '#FF3B30', secondary: '#1A1A1A' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
