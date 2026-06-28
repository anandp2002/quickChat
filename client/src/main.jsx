import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@/store/store';
import { AuthListener } from '@/store/AuthListener';
import App from '@/App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthListener />
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
