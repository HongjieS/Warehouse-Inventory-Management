import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { parsePDFWorldFamous } from '../parsers/worldFamousParser';
import { parsePDFEternal } from '../parsers/eternalParser';
import { parsePDFSolidInk } from '../parsers/solidInkParser';
import { saveStock, getStock, clearStock, exportStock, importStock, setStock, saveStockVersion, getStockVersions, restoreStockVersion } from '../services/stockService';
import { translate, getCurrentLanguage, setLanguage, LANGUAGES } from '../services/languageService';
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
  FileDownload,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import EditItemDialog from './EditItemDialog';
import AddItemDialog from './AddItemDialog';
import HistoryView from './HistoryView';
import InvoiceCreator from './InvoiceCreator';
import { addHistoryEntry, ACTION_TYPES } from '../services/historyService';

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

const InvoiceViewer = ({ type, title, large }) => {
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
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoring, setRestoring] = useState(false);

  const loadCurrentStock = useCallback(() => {
    const currentStock = getStock(type);
    setStockData(currentStock);
    setTotalItems(currentStock.length);
    setTotalQuantity(currentStock.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0));
  }, [type]);

  useEffect(() => {
    loadCurrentStock();
  }, [loadCurrentStock]);

  // Helper to save uploaded file in localStorage and return a unique key
  const saveUploadedFile = (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result;
        const fileKey = `${type}_invoice_${Date.now()}_${file.name}`;
        try {
          localStorage.setItem(fileKey, base64);
          resolve(fileKey);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let invoiceFileKey = null;
      // Save the uploaded file and get a reference key
      invoiceFileKey = await saveUploadedFile(file);

      // Check if it's a JSON file (stock data)
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = importStock(e.target.result);
            if (importedData.type !== type) {
              throw new Error(`Invalid stock type. Expected ${type} but got ${importedData.type}`);
            }
            setInvoiceData(importedData.items);
            setCurrentView('import');
            // Record import in history with file reference
            addHistoryEntry(type, {
              action: ACTION_TYPES.IMPORT,
              items: [...importedData.items],
              user: 'Current User',
              notes: `Imported ${importedData.items.length} items from JSON`,
              file: { name: file.name, dataUrl: invoiceFileKey }
            });
          } catch (error) {
            setError(error.message);
          }
          setLoading(false);
        };
        reader.readAsText(file);
        return;
      }

      // Handle PDF files as before
      if (!file.name.endsWith('.pdf')) {
        throw new Error('Please upload a PDF file');
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let parsedData;
          if (type === 'worldFamous') {
            parsedData = await parsePDFWorldFamous(e.target.result);
            saveStock('worldFamous', parsedData);
          } else if (type === 'eternal') {
            parsedData = await parsePDFEternal(e.target.result);
            saveStock('eternal', parsedData);
          } else if (type === 'solidInk') {
            parsedData = await parsePDFSolidInk(e.target.result);
            saveStock('solidInk', parsedData);
          }
          setInvoiceData(parsedData);
          setCurrentView('import');
          // Record import in history with file reference
          addHistoryEntry(type, {
            action: ACTION_TYPES.IMPORT,
            items: [...parsedData],
            user: 'Current User',
            notes: `Imported ${parsedData.length} items from PDF`,
            file: { name: file.name, dataUrl: invoiceFileKey }
          });
        } catch (error) {
          setError(error.message);
        }
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleExportStock = () => {
    try {
      const exportData = exportStock(type);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-stock-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      // Record export in history
      addHistoryEntry(type, {
        action: ACTION_TYPES.EXPORT,
        items: [...stockData],
        user: 'Current User',
        notes: `Exported stock data (${stockData.length} items)`
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSave = (editedItem) => {
    if (currentView === 'stock') {
      const versionId = saveStockVersion(type, 'edit', stockData);
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

      addHistoryEntry(type, {
        action: ACTION_TYPES.EDIT,
        items: [editedItem],
        user: 'Current User',
        notes: 'Item edited',
        changes,
        previousState: originalItem,
        newState: editedItem,
        versionId
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
    const versionId = saveStockVersion(type, 'import', stockData);
    setStock(type, invoiceData);
    setStockData(invoiceData);
    addHistoryEntry(type, {
      action: ACTION_TYPES.IMPORT,
      items: [...invoiceData],
      user: 'Current User',
      notes: `Imported ${invoiceData.length} items`,
      batchId: new Date().getTime().toString(),
      quantity: invoiceData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0),
      versionId
    });
    setInvoiceData([]);
    setCurrentView('stock');
    loadCurrentStock();
  };

  const handleClearStock = () => {
    const versionId = saveStockVersion(type, 'clear', stockData);
    addHistoryEntry(type, {
      action: ACTION_TYPES.CLEAR,
      items: [...stockData],
      user: 'Current User',
      notes: 'All stock cleared',
      quantity: stockData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0),
      versionId
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
    const versionId = saveStockVersion(type, 'add', stockData);
    const updatedStock = [...stockData, newItem];
    saveStock(type, updatedStock);
    setStockData(updatedStock);
    
    // Add to history
    addHistoryEntry(type, {
      action: ACTION_TYPES.ADD,
      items: [newItem],
      user: 'Current User',
      notes: 'New item added manually',
      quantity: newItem.quantity,
      versionId
    });
    
    setAddDialogOpen(false);
    loadCurrentStock();
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    const versionId = saveStockVersion(type, 'delete', stockData);
    if (!itemToDelete) return;

    const updatedStock = stockData.filter(item => 
      !(item.itemCode === itemToDelete.itemCode && 
        item.color === itemToDelete.color && 
        item.size === itemToDelete.size)
    );
    
    saveStock(type, updatedStock);
    setStockData(updatedStock);
    
    // Add to history
    addHistoryEntry(type, {
      action: ACTION_TYPES.DELETE,
      items: [itemToDelete],
      user: 'Current User',
      notes: 'Item deleted',
      quantity: itemToDelete.quantity,
      versionId
    });
    
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
    loadCurrentStock();
  };

  const handleLanguageSwitch = () => {
    const newLanguage = currentLanguage === LANGUAGES.ENGLISH ? LANGUAGES.MANDARIN : LANGUAGES.ENGLISH;
    setLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };

  const openVersionModal = () => {
    setVersions(getStockVersions(type));
    setVersionModalOpen(true);
  };

  const handleRestoreVersion = async (versionId) => {
    setRestoring(true);
    try {
      restoreStockVersion(type, versionId);
      loadCurrentStock();
      setVersionModalOpen(false);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: large ? 1300 : 1000,
          p: large ? 6 : 4,
          mb: large ? 6 : 4,
          fontSize: large ? '1.25rem' : '1rem',
        }}
      >
        <Box sx={{ mb: large ? 4 : 2 }}>
          <Typography variant={large ? 'h3' : 'h4'} component="h1" gutterBottom>
            {title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: large ? '1.15rem' : '1rem' }}>
            {translate('Manage your inventory')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                aria-label="Add Item"
              >
                {translate('Add Item')}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownload />}
                onClick={handleExportStock}
                aria-label="Export Stock"
              >
                {translate('Export Stock')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setClearConfirmOpen(true)}
                aria-label="Clear Stock"
              >
                {translate('Clear Stock')}
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
                {translate('Upload Invoice')}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.json"
                  onChange={handleFileUpload}
                  aria-label="Invoice file input"
                />
              </Button>
            </Stack>
          </Box>
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
                label={translate('Current Stock')} 
                icon={<InventoryIcon />} 
                iconPosition="start"
              />
              {invoiceData.length > 0 && (
                <Tab 
                  value="import" 
                  label={translate('New Import')} 
                  icon={<CloudUploadIcon />} 
                  iconPosition="start"
                />
              )}
              <Tab 
                value="history" 
                label={translate('History')} 
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
                            {translate('Total Items')}
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
                            {translate('Total Quantity')}
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
                    <InputLabel>{translate('Search in')}</InputLabel>
                    <Select
                      value={searchField}
                      onChange={handleSearchFieldChange}
                      label={translate('Search in')}
                    >
                      <MenuItem value="all">{translate('All Fields')}</MenuItem>
                      <MenuItem value="color">{translate('Color')}</MenuItem>
                      <MenuItem value="itemCode">{translate('Item Code')}</MenuItem>
                      <MenuItem value="size">{translate('Size')}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    placeholder={`Search ${searchField === 'all' ? translate('all fields') : searchField}...`}
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
                      {translate('Confirm Import')}
                    </Button>
                  )}
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{translate('Item Code')}</TableCell>
                        <TableCell>{translate('Color')}</TableCell>
                        <TableCell align="right">{translate('Quantity')}</TableCell>
                        <TableCell>{translate('Size')}</TableCell>
                        <TableCell align="center">{translate('Actions')}</TableCell>
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
                                  aria-label={translate('Edit item')}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(item)}
                                  color="error"
                                  aria-label={translate('Delete item')}
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
          <DialogTitle id="clear-confirm-title">{translate('Clear Stock Confirmation')}</DialogTitle>
          <DialogContent id="clear-confirm-description">
            <Typography>
              {translate('Are you sure you want to clear all')} {type === 'worldFamous' ? 'World Famous' : type === 'eternal' ? 'Eternal' : 'Solid Ink'} {translate('stock data? This action cannot be undone.')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClearConfirmOpen(false)}
              aria-label="Cancel Clear"
            >
              {translate('Cancel')}
            </Button>
            <Button 
              onClick={handleClearStock} 
              color="error" 
              variant="contained"
              aria-label="Confirm Clear Stock"
            >
              {translate('Clear Stock')}
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
          <DialogTitle id="delete-confirm-title">{translate('Delete Item')}</DialogTitle>
          <DialogContent id="delete-confirm-description">
            <Typography>
              {translate('Are you sure you want to delete this item?')}
            </Typography>
            {itemToDelete && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">{translate('Item Details:')}</Typography>
                <Typography>{translate('Code:')} {itemToDelete.itemCode}</Typography>
                <Typography>{translate('Color:')} {itemToDelete.color}</Typography>
                <Typography>{translate('Size:')} {itemToDelete.size}</Typography>
                <Typography>{translate('Quantity:')} {itemToDelete.quantity}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }}
              aria-label={translate('Cancel Delete')}
            >
              {translate('Cancel')}
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error" 
              variant="contained"
              aria-label={translate('Confirm Delete')}
            >
              {translate('Delete')}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={versionModalOpen} onClose={() => setVersionModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Version History</DialogTitle>
          <DialogContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Restore</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{new Date(v.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{v.action}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        disabled={restoring}
                        onClick={() => handleRestoreVersion(v.id)}
                      >
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVersionModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default InvoiceViewer; 