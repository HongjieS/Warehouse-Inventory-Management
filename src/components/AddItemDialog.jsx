import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const AddItemDialog = ({ open, onClose, onSave }) => {
  const [newItem, setNewItem] = useState({
    itemCode: '',
    color: '',
    quantity: '',
    size: '',
  });

  const handleChange = (field) => (event) => {
    setNewItem(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = () => {
    // Convert quantity to number
    const itemToSave = {
      ...newItem,
      quantity: parseInt(newItem.quantity) || 0
    };
    onSave(itemToSave);
    setNewItem({
      itemCode: '',
      color: '',
      quantity: '',
      size: '',
    });
  };

  const isFormValid = () => {
    return newItem.itemCode && 
           newItem.color && 
           newItem.quantity && 
           newItem.size;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Item</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Code"
              value={newItem.itemCode}
              onChange={handleChange('itemCode')}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Color"
              value={newItem.color}
              onChange={handleChange('color')}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={newItem.quantity}
              onChange={handleChange('quantity')}
              required
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Size"
              value={newItem.size}
              onChange={handleChange('size')}
              required
              placeholder="e.g., 1oz, 2oz, 4oz"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!isFormValid()}
        >
          Add Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemDialog; 