import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { formatDateToISOFormat } from '../../../utils/dateUtils';

interface DateRangeInputProps {
  dateStart: string;
  dateEnd: string;
  onDateChange: (field: 'dateStart' | 'dateEnd', value: string) => void;
}

const DateRangeInput: React.FC<DateRangeInputProps> = ({
  dateStart,
  dateEnd,
  onDateChange
}) => {
  // Функция для валидации и ограничения ввода года
  const handleDateChange = (field: 'dateStart' | 'dateEnd', value: string) => {
    // Проверяем, что дата соответствует формату YYYY-MM-DD
    // и что год содержит только 4 цифры
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year] = value.split('-');
      // Если год больше 4 цифр, ограничиваем его
      if (year.length <= 4) {
        onDateChange(field, value);
      }
    } else {
      // Если формат неверный, всё равно передаем значение
      // (пустая строка или неполная дата)
      onDateChange(field, value);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Диапазон дат
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Начальная дата
          </Typography>
          <TextField 
            type="date"
            value={dateStart}
            onChange={(e) => handleDateChange('dateStart', e.target.value)}
            fullWidth
            size="small"
            inputProps={{
              max: "9999-12-31", // Ограничиваем максимальный год 4 цифрами
              pattern: "\\d{4}-\\d{2}-\\d{2}" // Ограничиваем формат YYYY-MM-DD
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
        
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Конечная дата
          </Typography>
          <TextField 
            type="date"
            value={dateEnd}
            onChange={(e) => handleDateChange('dateEnd', e.target.value)}
            fullWidth
            size="small"
            inputProps={{
              max: "9999-12-31", // Ограничиваем максимальный год 4 цифрами
              pattern: "\\d{4}-\\d{2}-\\d{2}" // Ограничиваем формат YYYY-MM-DD
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DateRangeInput; 