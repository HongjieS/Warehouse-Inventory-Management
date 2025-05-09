import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { parsePDFWorldFamous } from '../parsers/worldFamousParser';
import { parsePDFEternal } from '../parsers/eternalParser';
import { parsePDFSolidInk } from '../parsers/solidInkParser';
import { saveStock, getStock, clearStock } from '../services/stockService';
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
  Alert,
  CircularProgress,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Fade,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileUpload as FileUploadIcon,
  Clear as ClearIcon,
  Description as DescriptionIcon,
  Numbers as NumbersIcon,
  CloudUpload as CloudUploadIcon,
  Inventory as InventoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import EditItemDialog from './EditItemDialog';
import AddItemDialog from './AddItemDialog';
import HistoryView from './HistoryView';
import { addToHistory } from '../services/historyService';

const standardizeSizeFormat = (size, itemCode = '') => {
  if (!size && !itemCode) return '';
  
  // If size is not provided but itemCode contains '1/2', use that as size
  if (!size && itemCode.includes('1/2')) {
    return '0.5oz';
  }

  // If no size provided and no size in itemCode, return empty
  if (!size) return '';

  // Convert to lowercase and remove extra spaces
  const sizeStr = size.toLowerCase().trim().replace(/\s+/g, '');

  // Handle mm sizes (from hardware items)
  if (sizeStr.includes('mm')) {
    return sizeStr;
  }

  // Handle fractional sizes
  if (sizeStr.includes('/')) {
    const fraction = sizeStr.match(/([\d]+)\/([\d]+)/);
    if (fraction) {
      const decimal = parseFloat(fraction[1]) / parseFloat(fraction[2]);
      return `${decimal}oz`;
    }
  }

  // Handle various ounce formats
  const ounceFormats = [
    /^([\d.]+)\s*(?:ounce|ounces|oz\.?|)$/i,  // matches: 1 ounce, 1oz, 1, etc.
    /^([\d.]+)\s*(?:oz\.?|ounce|ounces)$/i,   // matches: 1oz, 1 oz., etc.
  ];

  for (const format of ounceFormats) {
    const match = sizeStr.match(format);
    if (match) {
      const number = parseFloat(match[1]);
      return `${number}oz`;
    }
  }

  // If it's just a number, assume it's ounces
  if (!isNaN(parseFloat(sizeStr))) {
    return `${parseFloat(sizeStr)}oz`;
  }

  // If we can't parse it, return the original size
  return size;
};

const InvoiceViewer = ({ type, title, invoiceName }) => {
  const [currentView, setCurrentView] = useState('stock');
  const [invoiceData, setInvoiceData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [totalItems, setTotalItems] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadCurrentStock = useCallback(() => {
    const currentStock = getStock(type);
    setStockData(currentStock);
    setTotalItems(currentStock.length);
    setTotalQuantity(currentStock.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0));
  }, [type]);

  useEffect(() => {
    loadCurrentStock();
  }, [loadCurrentStock]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      let parsedData;
      switch (type) {
        case 'worldFamous':
          parsedData = await parsePDFWorldFamous(arrayBuffer);
          break;
        case 'eternal':
          parsedData = await parsePDFEternal(arrayBuffer);
          break;
        case 'solidInk':
          parsedData = await parsePDFSolidInk(arrayBuffer);
          break;
        default:
          throw new Error('Invalid type');
      }
      setInvoiceData(parsedData);
      addToHistory(type, 'IMPORT', parsedData, `Imported ${invoiceName || file.name}`);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSave = (editedItem) => {
    if (currentView === 'stock') {
      const updatedStock = stockData.map(item => 
        (item.itemCode === editedItem.itemCode && 
         item.color === editedItem.color && 
         item.size === editedItem.size) 
          ? editedItem 
          : item
      );
      saveStock(type, updatedStock);
      setStockData(updatedStock);
      
      // Enhanced history tracking for edits
      const originalItem = stockData.find(item => 
        item.itemCode === editedItem.itemCode && 
        item.color === editedItem.color && 
        item.size === editedItem.size
      );
      
      const changes = {};
      Object.keys(editedItem).forEach(key => {
        if (editedItem[key] !== originalItem[key]) {
          changes[key] = {
            from: originalItem[key],
            to: editedItem[key]
          };
        }
      });

      addToHistory(type, 'EDIT', editedItem, {
        user: 'Current User', // Replace with actual user when authentication is implemented
        notes: 'Item edited',
        changes,
        previousState: originalItem,
        newState: editedItem
      });
    } else {
      const updatedImport = invoiceData.map(item => 
        (item.itemCode === editedItem.itemCode && 
         item.color === editedItem.color && 
         item.size === editedItem.size) 
          ? editedItem 
          : item
      );
      setInvoiceData(updatedImport);
    }
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  const handleConfirmImport = () => {
    const updatedStock = saveStock(type, invoiceData);
    setStockData(updatedStock);
    
    // Enhanced history tracking for imports
    addToHistory(type, 'IMPORT', invoiceData, {
      user: 'Current User', // Replace with actual user when authentication is implemented
      notes: `Imported ${invoiceData.length} items`,
      batchId: new Date().getTime().toString(),
      quantity: invoiceData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
    });
    
    setInvoiceData([]);
    setCurrentView('stock');
    loadCurrentStock();
  };

  const handleClearStock = () => {
    // Enhanced history tracking for clearing stock
    addToHistory(type, 'CLEAR', stockData, {
      user: 'Current User', // Replace with actual user when authentication is implemented
      notes: 'All stock cleared',
      quantity: stockData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
    });
    
    clearStock(type);
    loadCurrentStock();
    setClearConfirmOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSearchFieldChange = (event) => {
    setSearchField(event.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const filteredData = useMemo(() => {
    const dataToFilter = currentView === 'stock' ? stockData : invoiceData;
    return dataToFilter.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      
      if (searchField === 'all') {
        return Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchLower)
        );
      }
      
      return item[searchField]?.toString().toLowerCase().includes(searchLower);
    });
  }, [stockData, invoiceData, currentView, searchTerm, searchField]);

  const handleAddItem = (newItem) => {
    const updatedStock = [...stockData, newItem];
    saveStock(type, updatedStock);
    setStockData(updatedStock);
    
    // Add to history
    addToHistory(type, 'ADD', newItem, {
      user: 'Current User', // Replace with actual user when authentication is implemented
      notes: 'New item added manually',
      quantity: newItem.quantity
    });
    
    setAddDialogOpen(false);
    loadCurrentStock();
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const updatedStock = stockData.filter(item => 
      !(item.itemCode === itemToDelete.itemCode && 
        item.color === itemToDelete.color && 
        item.size === itemToDelete.size)
    );
    
    saveStock(type, updatedStock);
    setStockData(updatedStock);
    
    // Add to history
    addToHistory(type, 'DELETE', itemToDelete, {
      user: 'Current User', // Replace with actual user when authentication is implemented
      notes: 'Item deleted',
      quantity: itemToDelete.quantity
    });
    
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
    loadCurrentStock();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={500}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Manage your {type === 'worldFamous' ? 'World Famous' : type === 'eternal' ? 'Eternal' : 'Solid Ink'} inventory
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                aria-label="Add Item"
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setClearConfirmOpen(true)}
                aria-label="Clear Stock"
              >
                Clear Stock
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                sx={{ 
                  minWidth: 180,
                  backgroundColor: type === 'worldFamous' ? '#1e40af' : type === 'eternal' ? '#5b21b6' : '#5b21b6',
                  '&:hover': {
                    backgroundColor: type === 'worldFamous' ? '#1e3a8a' : type === 'eternal' ? '#4c1d95' : '#4c1d95',
                  }
                }}
                aria-label="Upload Invoice"
              >
                Upload Invoice
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileUpload}
                  aria-label="Invoice file input"
                />
              </Button>
            </Stack>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {(stockData.length > 0 || invoiceData.length > 0 || showHistory) && (
            <>
              <Tabs
                value={showHistory ? 'history' : currentView}
                onChange={(e, newValue) => {
                  if (newValue === 'history') {
                    setShowHistory(true);
                  } else {
                    setShowHistory(false);
                    setCurrentView(newValue);
                  }
                }}
                sx={{ mb: 3 }}
              >
                <Tab 
                  value="stock" 
                  label="Current Stock" 
                  icon={<InventoryIcon />} 
                  iconPosition="start"
                />
                {invoiceData.length > 0 && (
                  <Tab 
                    value="import" 
                    label="New Import" 
                    icon={<CloudUploadIcon />} 
                    iconPosition="start"
                  />
                )}
                <Tab 
                  value="history" 
                  label="History" 
                  icon={<HistoryIcon />} 
                  iconPosition="start"
                />
              </Tabs>

              {showHistory ? (
                <HistoryView type={type} />
              ) : (
                <>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" color="text.secondary">
                              Total Items
                            </Typography>
                          </Box>
                          <Typography variant="h4" color="primary">
                            {currentView === 'stock' ? stockData.length : invoiceData.length}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <NumbersIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" color="text.secondary">
                              Total Quantity
                            </Typography>
                          </Box>
                          <Typography variant="h4" color="primary">
                            {currentView === 'stock' 
                              ? stockData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
                              : invoiceData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
                            }
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Search in</InputLabel>
                      <Select
                        value={searchField}
                        onChange={handleSearchFieldChange}
                        label="Search in"
                      >
                        <MenuItem value="all">All Fields</MenuItem>
                        <MenuItem value="color">Color</MenuItem>
                        <MenuItem value="itemCode">Item Code</MenuItem>
                        <MenuItem value="size">Size</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      placeholder={`Search ${searchField === 'all' ? 'all fields' : searchField}...`}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={clearSearch}>
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: 300 }}
                    />
                    {currentView === 'import' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleConfirmImport}
                      >
                        Confirm Import
                      </Button>
                    )}
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item Code</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((item, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{item.itemCode}</TableCell>
                              <TableCell>{item.color}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell>{item.size}</TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditClick(item)}
                                    color="primary"
                                    aria-label="Edit item"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClick(item)}
                                    color="error"
                                    aria-label="Delete item"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ mt: 2 }}
                  />
                </>
              )}
            </>
          )}

          <Dialog
            open={clearConfirmOpen}
            onClose={() => setClearConfirmOpen(false)}
            aria-labelledby="clear-confirm-title"
            aria-describedby="clear-confirm-description"
          >
            <DialogTitle id="clear-confirm-title">Clear Stock Confirmation</DialogTitle>
            <DialogContent id="clear-confirm-description">
              <Typography>
                Are you sure you want to clear all {type === 'worldFamous' ? 'World Famous' : type === 'eternal' ? 'Eternal' : 'Solid Ink'} stock data? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setClearConfirmOpen(false)}
                aria-label="Cancel Clear"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleClearStock} 
                color="error" 
                variant="contained"
                aria-label="Confirm Clear Stock"
              >
                Clear Stock
              </Button>
            </DialogActions>
          </Dialog>

          <EditItemDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onSave={handleEditSave}
          />

          <AddItemDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            onSave={handleAddItem}
          />

          <Dialog
            open={deleteConfirmOpen}
            onClose={() => {
              setDeleteConfirmOpen(false);
              setItemToDelete(null);
            }}
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-description"
          >
            <DialogTitle id="delete-confirm-title">Delete Item</DialogTitle>
            <DialogContent id="delete-confirm-description">
              <Typography>
                Are you sure you want to delete this item?
              </Typography>
              {itemToDelete && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Item Details:</Typography>
                  <Typography>Code: {itemToDelete.itemCode}</Typography>
                  <Typography>Color: {itemToDelete.color}</Typography>
                  <Typography>Size: {itemToDelete.size}</Typography>
                  <Typography>Quantity: {itemToDelete.quantity}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setItemToDelete(null);
                }}
                aria-label="Cancel Delete"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                color="error" 
                variant="contained"
                aria-label="Confirm Delete"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Fade>
    </Container>
  );
};

export default InvoiceViewer; 