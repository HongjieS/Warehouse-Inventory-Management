import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import InvoiceViewer from './InvoiceViewer';
import { translate, getCurrentLanguage, setLanguage, LANGUAGES } from '../services/languageService';
import InvoicesTab from './InvoicesTab';

const BRAND_TYPES = [
  { label: 'World Famous', value: 'worldFamous' },
  { label: 'Eternal', value: 'eternal' },
  { label: 'Solid Ink', value: 'solidInk' },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 6, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ mb: 6, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Removed Dashboard title */}
      </Box>
      <Box sx={{ width: '100%', maxWidth: 1400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{
          width: '100%',
          maxWidth: 1200,
          mb: 4,
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: 'background.paper',
          border: '1.5px solid',
          borderColor: 'divider',
          p: 1,
        }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1.35rem',
                textTransform: 'none',
                fontWeight: 600,
                py: 2,
                transition: 'color 0.2s',
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
                borderBottom: '3px solid',
                borderColor: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                boxShadow: 2,
                zIndex: 1,
              },
              backgroundColor: 'background.paper',
              borderRadius: 3,
            }}
          >
            {BRAND_TYPES.map((brand, idx) => (
              <Tab key={brand.value} label={brand.label} />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
          {selectedTab === 0 && (
            <InvoiceViewer type="worldFamous" title="World Famous Inventory" large />
          )}
          {selectedTab === 1 && (
            <InvoiceViewer type="eternal" title="Eternal Inventory" large />
          )}
          {selectedTab === 2 && (
            <InvoiceViewer type="solidInk" title="Solid Ink Inventory" large />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 