import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// Инициализируем локализацию для корректного отображения формата dd/mm/yyyy
dayjs.locale('ru');

interface DatePickerProviderProps {
  children: React.ReactNode;
}

export const DatePickerProvider: React.FC<DatePickerProviderProps> = ({ children }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      {children}
    </LocalizationProvider>
  );
};

export default DatePickerProvider; 