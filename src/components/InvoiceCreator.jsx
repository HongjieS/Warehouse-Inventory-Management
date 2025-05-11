import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { getStock, saveStock, setStock, saveStockVersion } from '../services/stockService';
import { addHistoryEntry, ACTION_TYPES } from '../services/historyService';
import { translate } from '../services/languageService';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { saveInvoice } from '../services/invoiceService';

const InvoiceCreator = () => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    brand: '',
    itemCode: '',
    color: '',
    size: '',
    quantity: '',
  });
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState({
    worldFamous: [],
    eternal: [],
    solidInk: [],
  });

  useEffect(() => {
    // Load stock data for all brands
    setStockData({
      worldFamous: getStock('worldFamous'),
      eternal: getStock('eternal'),
      solidInk: getStock('solidInk'),
    });

    // Listen for localStorage changes (e.g., after invoice upload)
    const handleStorage = (event) => {
      if ([
        'worldFamousStock',
        'eternalStock',
        'solidInkStock'
      ].includes(event.key)) {
        setStockData({
          worldFamous: getStock('worldFamous'),
          eternal: getStock('eternal'),
          solidInk: getStock('solidInk'),
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setCurrentItem(prev => ({ ...prev, brand, itemCode: '', color: '', size: '', quantity: '' }));
    // Reload stock for the selected brand
    setStockData(prev => ({
      ...prev,
      [brand]: getStock(brand)
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.brand || !currentItem.color || !currentItem.size || !currentItem.quantity) {
      setError('Please fill in all fields');
      return;
    }

    const quantity = parseInt(currentItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Check if we have enough stock
    const brandStock = stockData[currentItem.brand] || [];
    const existingItem = brandStock.find(
      item => item.color === currentItem.color && item.size === currentItem.size
    );

    if (!existingItem || existingItem.quantity < quantity) {
      setError('Not enough stock available');
      return;
    }

    setItems(prev => [...prev, { ...currentItem, quantity }]);
    setCurrentItem({
      brand: selectedBrand,
      itemCode: '',
      color: '',
      size: '',
      quantity: '',
    });
    setError(null);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = () => {
    if (items.length === 0) {
      setError('Please add at least one item to the invoice');
      return;
    }

    // Group items by brand
    const itemsByBrand = items.reduce((acc, item) => {
      if (!acc[item.brand]) {
        acc[item.brand] = [];
      }
      acc[item.brand].push(item);
      return acc;
    }, {});

    // Save the invoice
    const invoice = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      brands: Object.keys(itemsByBrand),
      items: items,
    };
    saveInvoice(invoice);

    // Update stock for each brand
    Object.entries(itemsByBrand).forEach(([brand, brandItems]) => {
      const currentStock = stockData[brand] || [];
      saveStockVersion(brand, 'export', currentStock); // Save version before export
      // Subtract invoice quantities from stock
      const updatedStock = currentStock.map(item => {
        const invoiceItem = brandItems.find(
          i => i.color === item.color && i.size === item.size
        );
        if (invoiceItem) {
          return {
            ...item,
            quantity: item.quantity - invoiceItem.quantity,
          };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with zero or negative quantity

      // Save updated stock
      setStock(brand, updatedStock);

      // Add to history
      addHistoryEntry(brand, {
        action: ACTION_TYPES.EXPORT,
        items: brandItems,
        user: 'Current User',
        notes: 'Items exported via invoice creation',
        quantity: brandItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    });

    // Reset form
    setSelectedBrand('');
    setItems([]);
    setCurrentItem({
      brand: '',
      itemCode: '',
      color: '',
      size: '',
      quantity: '',
    });
    setError(null);
  };

  // Build options from all stock items for the selected brand
  const getAvailableStockOptions = () => {
    if (!selectedBrand) return [];
    const brandStock = stockData[selectedBrand] || [];
    return brandStock.map(item => ({
      itemCode: item.itemCode,
      color: item.color,
      size: item.size,
      label: `${item.itemCode} - ${item.color} - ${item.size}`
    }));
  };

  // Custom filter for fuzzy/partial matching
  const filterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) => `${option.itemCode} ${option.color} ${option.size}`,
  });

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {translate('Create New Invoice')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                label="Brand"
              >
                <MenuItem value="worldFamous">World Famous</MenuItem>
                <MenuItem value="eternal">Eternal</MenuItem>
                <MenuItem value="solidInk">Solid Ink</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete
              value={currentItem.itemCode && currentItem.color && currentItem.size ? {
                itemCode: currentItem.itemCode,
                color: currentItem.color,
                size: currentItem.size,
                label: `${currentItem.itemCode} - ${currentItem.color} - ${currentItem.size}`
              } : null}
              onChange={(event, newValue) => {
                setCurrentItem(prev => ({
                  ...prev,
                  itemCode: newValue ? newValue.itemCode : '',
                  color: newValue ? newValue.color : '',
                  size: newValue ? newValue.size : '',
                }));
              }}
              options={getAvailableStockOptions()}
              filterOptions={filterOptions}
              getOptionLabel={option => option.label || ''}
              disabled={!selectedBrand}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Item Code - Color - Size"
                  variant="outlined"
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option.itemCode === value.itemCode && option.color === value.color && option.size === value.size
              }
              filterSelectedOptions
              autoHighlight
              autoSelect
              clearOnBlur
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: e.target.value }))}
              disabled={!currentItem.size}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddItem}
              disabled={!currentItem.size || !currentItem.quantity}
              sx={{ height: '100%' }}
            >
              <AddIcon />
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.color}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleCreateInvoice}
            disabled={items.length === 0}
          >
            {translate('Create Invoice')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceCreator; 