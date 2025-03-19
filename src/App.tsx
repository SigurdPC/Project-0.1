import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navigation from './components/Navigation';
import BunkeringOperation from './pages/BunkeringOperation';
import DailyEvents from './pages/DailyEvents';
import DailyROB from './pages/DailyROB';
import DPHoursPage from './pages/DPHours';

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
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/bunkering" replace />} />
          <Route path="/bunkering" element={<BunkeringOperation />} />
          <Route path="/daily-events" element={<DailyEvents />} />
          <Route path="/daily-rob" element={<DailyROB />} />
          <Route path="/dp-hours" element={<DPHoursPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
