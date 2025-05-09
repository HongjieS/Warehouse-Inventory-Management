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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import InvoiceViewer from './InvoiceViewer';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: '#042647',
            color: 'white',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'white' }}>
            Warehouse Manager
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
        <List>
          <ListItem button selected={true}>
            <ListItemIcon>
              <DashboardIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <HistoryIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="History" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <AssessmentIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{ backgroundColor: '#042647', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Warehouse Inventory
            </Typography>
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
    </Box>
  );
};

export default Dashboard; 