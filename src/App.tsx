import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import StockView from './views/StockView'
import HistoryView from './views/HistoryView'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const currentView = useStore((state) => state.currentView)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Layout>
            <Routes>
              <Route path="/" element={currentView === 'Stock' ? <StockView /> : <HistoryView />} />
            </Routes>
          </Layout>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App 