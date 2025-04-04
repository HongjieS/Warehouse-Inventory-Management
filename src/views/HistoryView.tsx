import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useStore } from '../store/useStore'

export default function HistoryView() {
  const { history, setHistory } = useStore()

  const toggleHistorySelection = (index: number) => {
    const updatedHistory = history.map((entry, i) =>
      i === index ? { ...entry, selected: !entry.selected } : entry
    )
    setHistory(updatedHistory)
  }

  const exportSelectedHistory = () => {
    const selectedEntries = history.filter((entry) => entry.selected)
    if (selectedEntries.length === 0) return

    const historyText = selectedEntries
      .map(
        (entry) =>
          `${entry.date} - ${entry.actionType} (${entry.brand}): ${
            entry.actionType === 'Import Excel'
              ? `Total Quantity Added: ${entry.details.totalQuantityAdded}`
              : entry.actionType === 'Bulk Edit'
              ? `Changes: ${Object.entries(entry.details)
                  .map(([desc, change]) => `${desc}: ${change}`)
                  .join(', ')}`
              : JSON.stringify(entry.details)
          }`
      )
      .join('\n')

    const blob = new Blob([historyText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory_history.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          History
        </Typography>
        <Button
          variant="contained"
          onClick={exportSelectedHistory}
          disabled={!history.some((entry) => entry.selected)}
        >
          Export Selected History
        </Button>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Select</TableCell>
              <TableCell>Date and Time</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Action Type</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={entry.selected}
                    onChange={() => toggleHistorySelection(index)}
                  />
                </TableCell>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.brand}</TableCell>
                <TableCell>{entry.actionType}</TableCell>
                <TableCell>
                  {entry.actionType === 'Import Excel'
                    ? `Total Quantity Added: ${entry.details.totalQuantityAdded}`
                    : entry.actionType === 'Bulk Edit'
                    ? `Changes: ${Object.entries(entry.details)
                        .map(([desc, change]) => `${desc}: ${change}`)
                        .join(', ')}`
                    : JSON.stringify(entry.details)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
} 