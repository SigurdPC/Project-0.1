import React, { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Snackbar, Alert, Paper } from '@mui/material';
import DPTimeSettings from '../components/dphours/views/DPTimeSettings';
import DPTimeResults from '../components/dphours/views/DPTimeResults';
import { 
  Shift, TimeCalculationSettings, 
  DPTimeOperation, TimeCalculationResult, SnackbarState 
} from '../components/dphours/types';
import { 
  getDPTimeOperations, calculateOperationTimesByShifts 
} from '../components/dphours/utils';
import dphoursApi, { DPHours as ApiDPHours } from '../api/dphoursApi';

const DPTimePage: React.FC = () => {
  // Состояние данных
  const [data, setData] = useState<ApiDPHours[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние уведомлений
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Состояние настроек расчета
  const [settings, setSettings] = useState<TimeCalculationSettings>({
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
  
  // Результаты расчета
  const [calculationResults, setCalculationResults] = useState<TimeCalculationResult[]>([]);
  
  // Мемоизированные операции
  const operations = useMemo<DPTimeOperation[]>(() => {
    // Преобразуем данные из API формата в формат для расчетов
    const dphoursData = data.map(item => ({
      id: item.id || Date.now().toString(), // Гарантируем наличие id
      date: item.date,
      time: item.time,
      location: item.location,
      operationType: item.operationType
    }));
    
    return getDPTimeOperations(dphoursData);
  }, [data]);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dphoursApi.getAllRecords();
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Ошибка загрузки данных. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Функция показа уведомления
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Обработчик закрытия уведомления
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Обработчики изменения настроек
  const handleStartDateChange = (date: string) => {
    setSettings(prev => ({ ...prev, startDate: date }));
  };
  
  const handleEndDateChange = (date: string) => {
    setSettings(prev => ({ ...prev, endDate: date }));
  };
  
  // Обработчики управления сменами
  const handleAddShift = () => {
    // Используем значения по умолчанию для новой смены
    const startTime = '08:00';
    const endTime = '20:00';
    // Автоматически определяем, является ли смена ночной
    const isOvernight = startTime > endTime;
    
    const newShift: Shift = {
      id: Date.now().toString(),
      startTime,
      endTime,
      isOvernight
    };
    
    setSettings(prev => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };
  
  const handleUpdateShift = (id: string, field: keyof Shift, value: any) => {
    setSettings(prev => ({
      ...prev,
      shifts: prev.shifts.map(shift => 
        shift.id === id ? { ...shift, [field]: value } : shift
      )
    }));
  };
  
  const handleDeleteShift = (id: string) => {
    setSettings(prev => ({
      ...prev,
      shifts: prev.shifts.filter(shift => shift.id !== id)
    }));
  };
  
  // Обработчик запуска расчета
  const handleCalculate = () => {
    if (operations.length === 0) {
      showSnackbar('Нет операций для расчета времени', 'warning');
      return;
    }
    
    try {
      const results = calculateOperationTimesByShifts(
        operations,
        settings.startDate,
        settings.endDate,
        settings.shifts
      );
      
      setCalculationResults(results);
      
      if (results.length > 0) {
        showSnackbar('Расчет успешно выполнен', 'success');
      } else {
        showSnackbar('Нет результатов для отображения. Проверьте настройки и даты', 'warning');
      }
    } catch (err) {
      console.error('Error during calculation:', err);
      showSnackbar('Ошибка при расчете времени', 'error');
    }
  };
  
  // Проверяем, есть ли результаты для отображения
  const hasResults = calculationResults.length > 0;
  
  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        DP Time
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
      {hasResults && (
        <Paper sx={{ mt: 3, p: 0, overflow: 'hidden' }}>
          <DPTimeResults 
            results={calculationResults}
            operations={operations}
            onBack={() => {}} // Пустая функция, так как интерфейсы объединены
          />
        </Paper>
      )}
      
      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DPTimePage; 