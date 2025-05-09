import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const [selectedCompany, setSelectedCompany] = useState('Eternal Ink LLC');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const companies = [
    'Eternal Ink LLC',
    'World Famous',
    'Premium Inks',
  ];

  const inventoryItems = [
    { id: 1, name: 'Black Ink', size: '4oz', quantity: 24, location: 'A1' },
    { id: 2, name: 'Red Ink', size: '2oz', quantity: 18, location: 'A2' },
    { id: 3, name: 'Blue Ink', size: '8oz', quantity: 12, location: 'B1' },
    { id: 4, name: 'Yellow Ink', size: '1oz', quantity: 30, location: 'B2' },
  ];

  const historyItems = [
    { id: 1, date: '2024-04-05', action: 'Stock Update', details: 'Added 10 units of Black Ink', user: 'Admin' },
    { id: 2, date: '2024-04-04', action: 'Import', details: 'Imported invoice W3678', user: 'System' },
    { id: 3, date: '2024-04-03', action: 'Adjustment', details: 'Manual quantity adjustment', user: 'Admin' },
  ];

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Company Selector Sidebar */}
      <Paper 
        sx={{ 
          width: 250, 
          height: '100%',
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Companies
          </Typography>
          <List>
            {companies.map((company) => (
              <ListItem key={company} disablePadding>
                <ListItemButton
                  selected={selectedCompany === company}
                  onClick={() => setSelectedCompany(company)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText primary={company} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {selectedCompany}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>

          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab icon={<InventoryIcon />} label="Inventory" />
            <Tab icon={<HistoryIcon />} label="History" />
          </Tabs>
        </Box>

        {activeTab === 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell>{item.details}</TableCell>
                    <TableCell>{item.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default HomePage; 