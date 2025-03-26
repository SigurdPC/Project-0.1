import React from 'react';
import { 
  Box, IconButton, Typography, Button, Paper, TextField
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Shift } from '../types';

interface ShiftInputProps {
  shifts: Shift[];
  onAddShift: () => void;
  onUpdateShift: (id: string, field: keyof Shift, value: any) => void;
  onDeleteShift: (id: string) => void;
}

const ShiftInput: React.FC<ShiftInputProps> = ({ 
  shifts, onAddShift, onUpdateShift, onDeleteShift 
}) => {
  // Обработчик изменения времени для смены
  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    // Проверяем, что введено валидное время
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
      onUpdateShift(id, field, value);
      
      // Автоматическое определение типа смены (ночная или дневная)
      const shift = shifts.find(s => s.id === id);
      if (shift) {
        // Получаем обновленные значения времени
        const startTime = field === 'startTime' ? value : shift.startTime;
        const endTime = field === 'endTime' ? value : shift.endTime;
        
        // Если оба времени валидны, определяем тип смены
        if (startTime && endTime && 
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime) && 
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
          // Если время начала больше времени окончания, это ночная смена
          const isOvernight = startTime > endTime;
          onUpdateShift(id, 'isOvernight', isOvernight);
        }
      }
    }
  };

  // Функция для форматирования типа смены
  const getShiftTypeText = (shift: Shift) => {
    if (!shift.startTime || !shift.endTime) return '';
    return shift.isOvernight ? '(Ночная смена)' : '(Дневная смена)';
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Рабочие смены
      </Typography>
      
      {shifts.map((shift, index) => (
        <Box 
          key={shift.id} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2, 
            pb: 2,
            borderBottom: index < shifts.length - 1 ? '1px solid #eee' : 'none' 
          }}
        >
          <TextField
            label="Начало смены"
            value={shift.startTime}
            onChange={(e) => handleTimeChange(shift.id, 'startTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            sx={{ width: 140, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="Конец смены"
            value={shift.endTime}
            onChange={(e) => handleTimeChange(shift.id, 'endTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            sx={{ width: 140, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ ml: 1, fontStyle: 'italic' }}
          >
            {getShiftTypeText(shift)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {shifts.length > 1 && (
            <IconButton 
              onClick={() => onDeleteShift(shift.id)}
              size="small"
              color="error"
              aria-label="удалить смену"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Button 
        variant="outlined" 
        onClick={onAddShift}
        sx={{ mt: 1 }}
      >
        Добавить смену
      </Button>
    </Paper>
  );
};

export default ShiftInput; 