import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import InvoiceViewer from './InvoiceViewer';
import { translate, getCurrentLanguage, setLanguage, LANGUAGES } from '../services/languageService';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleLanguageSwitch = () => {
    const newLanguage = currentLanguage === LANGUAGES.ENGLISH ? LANGUAGES.MANDARIN : LANGUAGES.ENGLISH;
    setLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ backgroundColor: '#042647', borderRadius: 0, boxShadow: 1, top: 0, left: 0, right: 0 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '56px !important', px: 3 }}>
          <Typography variant="h6" noWrap component="div">
            Warehouse Inventory
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleLanguageSwitch}
            sx={{ ml: 2, borderColor: 'white', color: 'white' }}
          >
            {currentLanguage === LANGUAGES.ENGLISH ? translate('Switch to Mandarin') : translate('Switch to English')}
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1rem',
                textTransform: 'none',
                fontWeight: 600,
                py: 2,
              },
            }}
          >
            <Tab label="World Famous" />
            <Tab label="Eternal" />
            <Tab label="Solid Ink" />
          </Tabs>
        </Paper>
        {selectedTab === 0 && (
          <InvoiceViewer 
            type="worldFamous"
            title="World Famous Inventory"
          />
        )}
        {selectedTab === 1 && (
          <InvoiceViewer 
            type="eternal"
            title="Eternal Inventory"
          />
        )}
        {selectedTab === 2 && (
          <InvoiceViewer 
            type="solidInk"
            title="Solid Ink Inventory"
            invoiceName="Invoice 5099.pdf"
          />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard; 