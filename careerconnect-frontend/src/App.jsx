import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, ThemeProvider } from './context';
import { ToastProvider } from './components/ui/Toast';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
