import React, { useState } from 'react';
import './App.css';
import {
  Container,
  CssBaseline,
  createTheme,
  ThemeProvider,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import InvoiceViewer from './components/InvoiceViewer';
import TestParseInvoice from './TestParseInvoice';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState('worldFamous');
  const [showParser, setShowParser] = useState(false);

  const handleTabChange = (event, newValue) => {
    if (newValue === 'parserTest') {
      setShowParser(true);
    } else {
      setShowParser(false);
      setCurrentTab(newValue);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Tabs
            value={showParser ? 'parserTest' : currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 4 }}
          >
            <Tab 
              value="worldFamous" 
              label="World Famous" 
            />
            <Tab 
              value="eternal" 
              label="Eternal" 
            />
            <Tab 
              value="solidInk" 
              label="Solid Ink" 
            />
            <Tab 
              value="parserTest" 
              label="Parser Test" 
            />
          </Tabs>

          {showParser ? (
            <TestParseInvoice />
          ) : (
            <InvoiceViewer 
              type={currentTab}
              title={
                currentTab === 'worldFamous' 
                  ? 'World Famous Inventory' 
                  : currentTab === 'eternal'
                  ? 'Eternal Inventory'
                  : 'Solid Ink Inventory'
              }
              invoiceName={
                currentTab === 'worldFamous' 
                  ? 'World Famous Invoice' 
                  : currentTab === 'eternal'
                  ? 'Eternal Invoice'
                  : 'Solid Ink Invoice'
              }
            />
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 