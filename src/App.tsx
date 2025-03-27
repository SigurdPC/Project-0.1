import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import DPHoursPage from './pages/DPHoursPage';
import BunkeringOperation from './pages/BunkeringOperation';
import DailyEvents from './pages/DailyEvents';
import DailyROB from './pages/DailyROB';
import { DPTimePage } from './pages/DPTimePage';
import DatePickerProvider from './providers/DatePickerProvider';

// Создаем тему Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DatePickerProvider>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/bunkering" element={<BunkeringOperation />} />
            <Route path="/daily-events" element={<DailyEvents />} />
            <Route path="/daily-rob" element={<DailyROB />} />
            <Route path="/dphours" element={<DPHoursPage />} />
            <Route path="/dptime" element={<DPTimePage />} />
            <Route path="/" element={<DPHoursPage />} />
          </Routes>
        </Router>
      </DatePickerProvider>
    </ThemeProvider>
  );
}

export default App;
