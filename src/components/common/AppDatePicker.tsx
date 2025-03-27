import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface AppDatePickerProps {
  label?: string;
  value: string | null; // значение в формате ISO (yyyy-mm-dd)
  onChange: (date: string | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  error = false,
  helperText,
  placeholder = 'dd/mm/yyyy',
  fullWidth = true,
  disabled = false
}) => {
  // Преобразуем ISO строку в объект dayjs
  const dayjsValue = value ? dayjs(value) : null;

  // Обработчик изменения даты
  const handleChange = (newValue: dayjs.Dayjs | null) => {
    if (newValue) {
      // Преобразуем dayjs объект в ISO строку (yyyy-mm-dd)
      onChange(newValue.format('YYYY-MM-DD'));
    } else {
      onChange(null);
    }
  };

  return (
    <DatePicker
      label={label}
      value={dayjsValue}
      onChange={handleChange}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          required,
          error,
          helperText,
          placeholder,
          fullWidth,
          disabled,
          size: "small"
        },
      }}
    />
  );
};

export default AppDatePicker; 