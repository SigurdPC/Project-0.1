import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import DPHoursPage from './pages/DPHoursPage';
import BunkeringOperation from './pages/BunkeringOperation';
import DailyEvents from './pages/DailyEvents';
import DailyROB from './pages/DailyROB';
import DatePickerProvider from './providers/DatePickerProvider';
import ThemeProvider from './providers/ThemeProvider';
import { DPTimePage } from './pages/DPTimePage';

function App() {
  return (
    <ThemeProvider>
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
