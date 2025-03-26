import React from 'react';
import { 
  Box, Paper, Typography, Button, TextField, 
  Grid, CircularProgress, Alert
} from '@mui/material';
import { Shift, TimeCalculationSettings } from '../types';
import ShiftInput from '../components/ShiftInput';

interface DPTimeSettingsProps {
  settings: TimeCalculationSettings;
  loading: boolean;
  error: string | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAddShift: () => void;
  onUpdateShift: (id: string, field: keyof Shift, value: any) => void;
  onDeleteShift: (id: string) => void;
  onCalculate: () => void;
}

const DPTimeSettings: React.FC<DPTimeSettingsProps> = ({
  settings,
  loading,
  error,
  onStartDateChange,
  onEndDateChange,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onCalculate
}) => {
  // Проверка валидности настроек перед расчетом
  const isValid = (): boolean => {
    if (!settings.startDate || !settings.endDate) {
      return false;
    }
    
    // Проверяем, что конечная дата не раньше начальной
    if (settings.startDate > settings.endDate) {
      return false;
    }
    
    // Проверяем, что все смены имеют начало и конец
    return settings.shifts.every(shift => 
      shift.startTime && 
      shift.endTime && 
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.startTime) && 
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.endTime)
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Настройки расчета
      </Typography>
      
      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Диапазон дат */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Диапазон дат
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Начальная дата"
            type="date"
            value={settings.startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Конечная дата"
            type="date"
            value={settings.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
      </Grid>
      
      {/* Настройка смен */}
      <ShiftInput
        shifts={settings.shifts}
        onAddShift={onAddShift}
        onUpdateShift={onUpdateShift}
        onDeleteShift={onDeleteShift}
      />
      
      {/* Кнопка расчета */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={loading || !isValid()}
          onClick={onCalculate}
          size="large"
          sx={{ minWidth: 150 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Рассчитать'}
        </Button>
      </Box>
    </Paper>
  );
};

export default DPTimeSettings; 