import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material'
import { useStore } from '../store/useStore'
import { StockItem } from '../store/useStore'
import * as XLSX from 'xlsx'

export default function StockView() {
  const {
    currentBrand,
    worldFamousStock,
    eternalStock,
    importData,
    searchQuery,
    showInStockOnly,
    isEditMode,
    selectedSize,
    setWorldFamousStock,
    setEternalStock,
    setImportData,
    setSearchQuery,
    setShowInStockOnly,
    setIsEditMode,
    setSelectedSize,
  } = useStore()

  const [file, setFile] = useState<File | null>(null)

  const currentStock = currentBrand === 'World Famous' ? worldFamousStock : eternalStock
  const setCurrentStock = currentBrand === 'World Famous' ? setWorldFamousStock : setEternalStock

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        const processedData = jsonData.slice(2).map((row: any) => ({
          description: row[1] || '',
          quantity: row[2] ? row[2] : 0,
        }))

        setImportData(processedData)
      }
      reader.readAsBinaryString(file)
    }
  }

  const handleStockChange = (index: number, field: keyof StockItem, value: string | number) => {
    const updatedStock = [...currentStock]
    updatedStock[index] = { ...updatedStock[index], [field]: value }
    setCurrentStock(updatedStock)
  }

  const addNewItem = () => {
    setCurrentStock([...currentStock, { description: '', quantity: 0 }])
  }

  const deleteItem = (index: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedStock = currentStock.filter((_, i) => i !== index)
      setCurrentStock(updatedStock)
    }
  }

  const filteredStock = currentStock.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSize = selectedSize ? item.description.includes(selectedSize) : true
    const isInStock = !showInStockOnly || item.quantity > 0
    return matchesSearch && matchesSize && isInStock
  })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Stock Management
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Finish Editing' : 'Edit Stock'}
                </Button>
              </Grid>
              <Grid item>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span">
                    Choose File
                  </Button>
                </label>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={!file}
                >
                  Import
                </Button>
              </Grid>
              {isEditMode && (
                <Grid item>
                  <Button variant="contained" onClick={addNewItem}>
                    Add New Item
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Size</InputLabel>
                  <Select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    label="Size"
                  >
                    <MenuItem value="">All Sizes</MenuItem>
                    <MenuItem value="1/2oz">1/2oz</MenuItem>
                    <MenuItem value="1oz">1oz</MenuItem>
                    <MenuItem value="4oz">4oz</MenuItem>
                    <MenuItem value="8oz">8oz</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                    />
                  }
                  label="Show In-Stock Only"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  {isEditMode && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStock.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          value={item.description}
                          onChange={(e) =>
                            handleStockChange(index, 'description', e.target.value)
                          }
                        />
                      ) : (
                        item.description
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditMode ? (
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleStockChange(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    {isEditMode && (
                      <TableCell align="right">
                        <Button
                          color="error"
                          onClick={() => deleteItem(index)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  )
} 