import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvoiceCreator from './components/InvoiceCreator';
import { translate } from './services/languageService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout onViewChange={handleViewChange}>
        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <InvoiceCreator />
        )}
      </Layout>
    </ThemeProvider>
  );
}

export default App; 