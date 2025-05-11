import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { translate, getCurrentLanguage, setLanguage, LANGUAGES } from '../services/languageService';
import InvoiceCreator from './InvoiceCreator';
import InvoicesTab from './InvoicesTab';

const drawerWidth = 240;
const collapsedWidth = 64;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [languageVersion, setLanguageVersion] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed((prev) => !prev);
  };

  const menuItems = [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'create-invoice', text: 'Create Invoice', icon: <ReceiptIcon /> },
    { id: 'invoices', text: 'Invoices', icon: <ReceiptIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: collapsed ? 'center' : 'space-between', px: 1 }}>
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            Warehouse
          </Typography>
        )}
        <IconButton onClick={handleCollapseToggle} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={collapsed ? translate(item.text) : ''} placement="right">
              <ListItemButton
                selected={selectedMenu === item.id}
                onClick={() => setSelectedMenu(item.id)}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 2,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={translate(item.text)} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Calculate dynamic width for AppBar and main content
  const getSidebarWidth = () => (collapsed ? collapsedWidth : drawerWidth);

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100vw - ${getSidebarWidth()}px)` },
          ml: { sm: `${getSidebarWidth()}px` },
          backgroundColor: '#042647',
          transition: 'width 0.2s, margin 0.2s',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {selectedMenu === 'dashboard' ? translate('Dashboard') : selectedMenu === 'create-invoice' ? translate('Create Invoice') : translate('Invoices')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={() => {
            const newLang = currentLanguage === LANGUAGES.ENGLISH ? LANGUAGES.MANDARIN : LANGUAGES.ENGLISH;
            setLanguage(newLang);
            setCurrentLanguage(newLang);
            setLanguageVersion(v => v + 1);
          }}>
            {currentLanguage === LANGUAGES.ENGLISH ? translate('Switch to Mandarin') : translate('Switch to English')}
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: getSidebarWidth() }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: getSidebarWidth(),
              transition: 'width 0.2s',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: { sm: `calc(100vw - ${getSidebarWidth()}px)` },
          mt: '64px',
          transition: 'width 0.2s',
          overflow: 'auto',
          minHeight: '100vh',
        }}
        key={languageVersion}
      >
        {selectedMenu === 'dashboard' ? (
          children
        ) : selectedMenu === 'create-invoice' ? (
          <InvoiceCreator />
        ) : selectedMenu === 'invoices' ? (
          <InvoicesTab />
        ) : null}
      </Box>
    </Box>
  );
};

export default Layout; 