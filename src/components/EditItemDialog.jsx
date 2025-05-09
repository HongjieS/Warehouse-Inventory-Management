import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Box,
} from '@mui/material';

const EditItemDialog = ({ open, onClose, item, onSave }) => {
  const [editedItem, setEditedItem] = useState({
    itemCode: '',
    color: '',
    size: '',
    quantity: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setEditedItem({
        itemCode: item.itemCode || '',
        color: item.color || '',
        size: item.size || '',
        quantity: item.quantity || 0
      });
      setErrors({});
    }
  }, [item]);

  const validateItem = () => {
    const newErrors = {};
    
    if (!editedItem.itemCode?.trim()) {
      newErrors.itemCode = 'Item Code is required';
    }
    
    if (!editedItem.color?.trim()) {
      newErrors.color = 'Color is required';
    }
    
    if (!editedItem.size?.trim()) {
      newErrors.size = 'Size is required';
    }
    
    if (editedItem.quantity < 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    const value = field === 'quantity' 
      ? Math.max(0, parseInt(event.target.value) || 0)
      : event.target.value;
    
    setEditedItem(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSave = () => {
    if (validateItem()) {
      onSave(editedItem);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="edit-dialog-title"
      aria-describedby="edit-dialog-description"
    >
      <DialogTitle id="edit-dialog-title">Edit Item</DialogTitle>
      <DialogContent id="edit-dialog-description">
        <Box sx={{ mt: 1 }}>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fix the errors before saving
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Code"
                value={editedItem.itemCode}
                onChange={handleChange('itemCode')}
                error={!!errors.itemCode}
                helperText={errors.itemCode}
                required
                autoFocus
                inputProps={{
                  'aria-label': 'Item Code'
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                value={editedItem.color}
                onChange={handleChange('color')}
                error={!!errors.color}
                helperText={errors.color}
                required
                inputProps={{
                  'aria-label': 'Color'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Size"
                value={editedItem.size}
                onChange={handleChange('size')}
                error={!!errors.size}
                helperText={errors.size}
                required
                inputProps={{
                  'aria-label': 'Size'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={editedItem.quantity}
                onChange={handleChange('quantity')}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ 
                  min: 0,
                  'aria-label': 'Quantity'
                }}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={Object.keys(errors).length > 0}
          aria-label="Save Changes"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog; 