import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Alert, CircularProgress, Snackbar } from '@mui/material';
import DPTimeSettings from '../components/dphours/views/DPTimeSettings';
import DPTimeResults from '../components/dphours/views/DPTimeResults';
import { DPTimeOperation, Shift, TimeCalculationResult } from '../components/dphours/types';
import { calculateOperationTimesByShifts, getDPTimeOperations } from '../components/dphours/utils';
import { useDataManagement } from '../components/dphours/hooks/useDataManagement';

interface DateRange {
  startDate: string;
  endDate: string;
  shifts: Shift[];
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const DPTimePage = () => {
  const { data, loading, error } = useDataManagement();
  const [results, setResults] = useState<TimeCalculationResult[]>([]);
  const [operations, setOperations] = useState<DPTimeOperation[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Состояние настроек расчета
  const [settings, setSettings] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    shifts: [
      {
        id: Date.now().toString(),
        startTime: '08:00',
        endTime: '20:00',
        isOvernight: false
      }
    ]
  });

  // Преобразуем данные в операции при их изменении
  useEffect(() => {
    if (data) {
      const dpOperations = getDPTimeOperations(data);
      setOperations(dpOperations);
    }
  }, [data]);

  // Обработчики изменения настроек
  const handleStartDateChange = (date: string) => {
    setSettings((prev: DateRange) => ({ ...prev, startDate: date }));
  };
  
  const handleEndDateChange = (date: string) => {
    setSettings((prev: DateRange) => ({ ...prev, endDate: date }));
  };
  
  const handleAddShift = () => {
    const newShift: Shift = {
      id: Date.now().toString(),
      startTime: '08:00',
      endTime: '20:00',
      isOvernight: false
    };
    
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };
  
  const handleUpdateShift = (id: string, field: keyof Shift, value: any) => {
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.map((shift: Shift) => 
        shift.id === id ? { ...shift, [field]: value } : shift
      )
    }));
  };
  
  const handleDeleteShift = (id: string) => {
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.filter((shift: Shift) => shift.id !== id)
    }));
  };
  
  const handleCalculate = () => {
    if (!data) {
      setSnackbar({
        open: true,
        message: 'Нет данных для расчета',
        severity: 'warning'
      });
      return;
    }
    
    const results = calculateOperationTimesByShifts(
      operations,
      settings.startDate,
      settings.endDate,
      settings.shifts
    );
    
    setResults(results);
    
    if (results.length > 0) {
      setSnackbar({
        open: true,
        message: 'Расчет успешно выполнен',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Нет результатов для отображения',
        severity: 'warning'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          DP Time Calculation
        </Typography>
        
        {/* Блок настроек */}
        <DPTimeSettings 
          settings={settings}
          loading={loading}
          error={error}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onAddShift={handleAddShift}
          onUpdateShift={handleUpdateShift}
          onDeleteShift={handleDeleteShift}
          onCalculate={handleCalculate}
        />
        
        {/* Блок результатов */}
        <DPTimeResults 
          results={results}
          operations={operations}
          onBack={() => {}} // Пустая функция, так как мы не используем навигацию назад
        />

        {/* Snackbar для уведомлений */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}; 