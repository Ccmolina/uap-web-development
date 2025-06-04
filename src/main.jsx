import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.css';
import App from './App.jsx';
import Boards from './pages/Boards.jsx';
import Settings from './pages/Settings.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Boards />} />
          <Route path="/board/:boardId" element={<App />} />
          <Route path="/config" element={<Settings />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
