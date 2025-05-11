import React, { useState, useEffect } from 'react';
import { getInvoices, clearInvoices } from '../services/invoiceService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material';
import * as XLSX from 'xlsx';

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const downloadInvoice = (invoice) => {
    const wsData = [
      ['Color Name', 'Size', 'Quantity'],
      ...invoice.items.map(item => [item.color, item.size, item.quantity])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `invoice_${invoice.id}.xlsx`);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewOpen(true);
  };

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Invoices</Typography>
        <Button variant="outlined" color="error" onClick={() => { clearInvoices(); setInvoices([]); }}>
          Clear Invoices
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Brand(s)</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{new Date(invoice.date).toLocaleString()}</TableCell>
                <TableCell>{invoice.brands.join(', ')}</TableCell>
                <TableCell>{invoice.items.length}</TableCell>
                <TableCell>
                  <Button variant="outlined" onClick={() => handleView(invoice)} sx={{ mr: 1 }}>
                    View
                  </Button>
                  <Button variant="outlined" onClick={() => downloadInvoice(invoice)}>
                    Download Excel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <>
              <Typography>Date: {new Date(selectedInvoice.date).toLocaleString()}</Typography>
              <Typography>Brand(s): {selectedInvoice.brands.join(', ')}</Typography>
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Color Name</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InvoicesTab; 