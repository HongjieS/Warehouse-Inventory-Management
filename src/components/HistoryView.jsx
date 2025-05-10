import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  Button,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Delete,
  FileDownload,
  FilterList,
  Search,
  Refresh,
  DateRange,
} from '@mui/icons-material';
import { getHistoryEntries, clearHistoryEntries, getHistoryStats, ACTION_TYPES } from '../services/historyService';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

const HistoryView = ({ type }) => {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    search: '',
    dateRange: null
  });
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadHistory = useCallback(() => {
    const historyData = getHistoryEntries(type);
    setHistory(historyData);
    setStats(getHistoryStats(type));
  }, [type]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearHistory = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearHistory = () => {
    clearHistoryEntries(type);
    loadHistory();
    setClearConfirmOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getActionColor = (action) => {
    switch (action) {
      case ACTION_TYPES.IMPORT:
        return 'success';
      case ACTION_TYPES.EDIT:
        return 'primary';
      case ACTION_TYPES.DELETE:
        return 'error';
      case ACTION_TYPES.ADJUST:
        return 'warning';
      case ACTION_TYPES.CLEAR:
        return 'error';
      case ACTION_TYPES.EXPORT:
        return 'info';
      case ACTION_TYPES.BULK_UPDATE:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatItemDetails = (items) => {
    if (!items) return 'No items';
    if (!Array.isArray(items)) items = [items];
    
    return items.map(item => (
      `${item.itemCode} - ${item.color} (${item.size}) x${item.quantity}`
    )).join(', ');
  };

  const handleExport = (format) => {
    const history = getHistoryEntries(type);
    let data, mimeType, fileExt;
    if (format === 'json') {
      data = JSON.stringify(history, null, 2);
      mimeType = 'application/json';
      fileExt = 'json';
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Action', 'User', 'Notes', 'Items', 'Changes'];
      const rows = history.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        entry.action,
        entry.user,
        entry.notes,
        JSON.stringify(entry.items),
        entry.changes ? JSON.stringify(entry.changes) : ''
      ]);
      data = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      mimeType = 'text/csv';
      fileExt = 'csv';
    }
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-history.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getGroupHeader = (date) => {
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return 'Today';
    if (isYesterday(parsedDate)) return 'Yesterday';
    if (isThisWeek(parsedDate)) return 'This Week';
    if (isThisMonth(parsedDate)) return 'This Month';
    return format(parsedDate, 'MMMM yyyy');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">History</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleClearHistory}
          >
            Clear History
          </Button>
        </Stack>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Entries
                </Typography>
                <Typography variant="h5">
                  {stats.totalEntries}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Items Affected
                </Typography>
                <Typography variant="h5">
                  {stats.itemsAffected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="h5">
                  {stats.lastUpdated ? format(parseISO(stats.lastUpdated), 'MMM d, HH:mm') : 'Never'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h5">
                  {stats.users.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Action Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {Object.values(ACTION_TYPES).map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="User"
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search in notes and items..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((entry, index) => (
                <React.Fragment key={index}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(index)}
                      >
                        {expandedRows[index] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        color={getActionColor(entry.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>
                      {Array.isArray(entry.items) 
                        ? `${entry.items.length} items affected`
                        : 'Single item modified'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                      <Collapse in={expandedRows[index]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Item Details:
                          </Typography>
                          <Typography variant="body2">
                            {formatItemDetails(entry.items)}
                          </Typography>
                          {entry.notes && (
                            <>
                              <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
                                Notes:
                              </Typography>
                              <Typography variant="body2">
                                {entry.notes}
                              </Typography>
                            </>
                          )}
                          {entry.changes && (
                            <>
                              <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
                                Changes:
                              </Typography>
                              <Typography variant="body2">
                                {JSON.stringify(entry.changes, null, 2)}
                              </Typography>
                            </>
                          )}
                          {entry.invoiceFileKey && entry.fileName && (
                            <>
                              <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
                                Invoice File:
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1, mb: 1 }}
                                onClick={() => {
                                  const dataUrl = localStorage.getItem(entry.invoiceFileKey);
                                  if (dataUrl) {
                                    const a = document.createElement('a');
                                    a.href = dataUrl;
                                    a.download = entry.fileName;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }
                                }}
                              >
                                Download {entry.fileName}
                              </Button>
                            </>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={history.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
      >
        <DialogTitle>Clear History</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all history? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmClearHistory} color="error" variant="contained">
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default HistoryView; 