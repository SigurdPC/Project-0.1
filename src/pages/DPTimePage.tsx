import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, Divider
} from '@mui/material';
import ShiftInput from '../components/dphours/components/ShiftInput';
import DateRangeInput from '../components/dphours/components/DateRangeInput';
import DPTimeResults, { OperationTime } from '../components/dphours/components/DPTimeResults';
import { Shift, DPHours } from '../components/dphours/types';
import { calculateOperationTimes, DPTimeSettings } from '../components/dphours/utils/calculations';
import { parseUserDateInput } from '../utils/dateUtils';

const DPTimePage: React.FC = () => {
  // Состояние для настроек расчёта
  const [settings, setSettings] = useState<DPTimeSettings>({
    dateStart: '',
    dateEnd: '',
    shifts: [
      {
        id: '1',
        startTime: '08:00',
        endTime: '20:00',
        isOvernight: false
      }
    ]
  });

  // Состояние для результатов расчёта
  const [results, setResults] = useState<OperationTime[]>([]);
  
  // Состояние для отображения индикатора загрузки
  const [loading, setLoading] = useState<boolean>(false);
  
  // Состояние для отображения сообщения об ошибке
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для управления видимостью результатов
  const [showResults, setShowResults] = useState<boolean>(false);

  // Обработчик изменения дат
  const handleDateChange = (field: 'dateStart' | 'dateEnd', value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Обработчик расчёта
  const handleCalculate = () => {
    setError(null);
    setLoading(true);
    
    try {
      // Проверка наличия всех необходимых данных
      if (!settings.dateStart || !settings.dateEnd) {
        throw new Error('Укажите начальную и конечную даты');
      }
      
      if (settings.shifts.length === 0) {
        throw new Error('Добавьте хотя бы одну смену');
      }
      
      // Проверка корректности дат
      const startDate = parseUserDateInput(settings.dateStart);
      const endDate = parseUserDateInput(settings.dateEnd);
      
      if (!startDate || !endDate) {
        throw new Error('Указаны некорректные даты');
      }
      
      if (startDate > endDate) {
        throw new Error('Дата начала не может быть позже даты окончания');
      }
      
      // Расчёт времени операций
      const calculatedTimes = calculateOperationTimes(settings);
      setResults(calculatedTimes);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при расчёте');
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        DP Time
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Настройки расчета
          </Typography>
          
          <DateRangeInput
            dateStart={settings.dateStart}
            dateEnd={settings.dateEnd}
            onDateChange={handleDateChange}
          />
          
          <ShiftInput
            shifts={settings.shifts}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
          />

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? 'Расчет...' : 'РАССЧИТАТЬ'}
            </Button>
          </Box>
        </Paper>
        
        {showResults && results.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Результаты расчета
            </Typography>
            
            <DPTimeResults results={results} />
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default DPTimePage; 