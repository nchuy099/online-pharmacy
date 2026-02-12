import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { router } from './app/routers/AppRouter';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './shared/components/ErrorBoundary';

import { ThemeProvider } from './shared/context/ThemeContext';
import { AccountLockedModal } from './features/auth/components/AccountLockedModal';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          />
          <RouterProvider router={router} />
          <AccountLockedModal />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
