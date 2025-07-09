import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DPHours } from '../types';
import AppDatePicker from '../../common/AppDatePicker';
import * as XLSX from 'xlsx';

interface ExcelExportButtonProps {
  paginatedDates: string[];
  getFilteredEventsForDate: (date: string) => DPHours[];
  getFilteredLocationsForDate: (date: string) => string[];
  fileName?: string;
  isNightMode: boolean;
}

const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  paginatedDates,
  getFilteredEventsForDate,
  getFilteredLocationsForDate,
  fileName = 'dp-hours-history',
  isNightMode
}) => {
  const theme = useTheme();
  // Состояние для диалога выбора дат
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Определяем минимальную и максимальную даты из доступного набора
  const minDate = paginatedDates.length > 0 ? paginatedDates.sort()[0] : '';
  const maxDate = paginatedDates.length > 0 ? paginatedDates.sort().slice(-1)[0] : '';

  // Обработчики диалога
  const handleOpenDialog = () => {
    setStartDate(minDate);
    setEndDate(maxDate);
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const validateDateRange = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return false;
    }

    return true;
  };

  const handleExport = useCallback(() => {
    if (!validateDateRange()) return;
    
    // Фильтруем даты по выбранному диапазону
    const filteredDates = paginatedDates.filter(date => {
      const currentDate = new Date(date);
      return currentDate >= new Date(startDate) && currentDate <= new Date(endDate);
    });
    
    if (filteredDates.length === 0) {
      setError('No data found in selected range');
      return;
    }

    // Сортируем даты в обратном порядке (от новых к старым)
    const sortedDates = [...filteredDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Соберем все данные в плоскую таблицу для Excel
    // Создаем двумерный массив для данных
    const excelData = [];
    
    // Добавляем заголовок
    excelData.push(['DP Log - Dina Supporter', '', '', '']);
    excelData.push([`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, '', '', '']);
    excelData.push(['', '', '', '']); // Пустая строка для разделения
    
    // Добавляем заголовки столбцов
    excelData.push(['Date', 'Location', 'Time', 'Operation Type']);
    
    // Группируем данные по дате и локации для форматирования как в печатной версии
    interface TableEntry {
      date: string;
      location: string;
      time: string;
      operationType: string;
    }
    
    const allTableData: TableEntry[] = [];
    
    sortedDates.forEach(date => {
      const formattedDate = formatDate(date);
      const locations = getFilteredLocationsForDate(date);
      
      locations.forEach(location => {
        const events = getFilteredEventsForDate(date).filter(
          event => event.location === location
        );
        
        // Сортируем события по времени (от ранних к поздним)
        const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
        
        sortedEvents.forEach(event => {
          allTableData.push({
            date: formattedDate,
            location,
            time: event.time,
            operationType: event.operationType
          });
        });
      });
    });
    
    // Сортировка данных
    allTableData.sort((a, b) => {
      // First compare by date (newest to oldest)
      // Convert DD/MM/YYYY format to objects for proper comparison
      const [dayA, monthA, yearA] = a.date.split('/').map(Number);
      const [dayB, monthB, yearB] = b.date.split('/').map(Number);
      
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      
      // Sort by date (newest first)
      const dateCompare = dateB.getTime() - dateA.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Then by location number
      const locationA = parseInt(a.location) || 0;
      const locationB = parseInt(b.location) || 0;
      const locationCompare = locationA - locationB;
      if (locationCompare !== 0) return locationCompare;
      
      // Finally by time (earliest first within each day)
      return a.time.localeCompare(b.time);
    });
    
    if (allTableData.length === 0) {
      setError('No data available for export');
      return;
    }
    
    // Добавляем данные так же, как они отображаются при печати
    let currentDate = '';
    let currentLocation = '';
    
    allTableData.forEach(entry => {
      const isNewDate = entry.date !== currentDate;
      const isNewLocation = isNewDate || entry.location !== currentLocation;
      
      currentDate = entry.date;
      currentLocation = entry.location;
      
      // Добавляем строку в таблицу
      excelData.push([
        isNewDate ? entry.date : '', // Отображаем дату только для новой даты
        isNewLocation ? entry.location : '', // Отображаем локацию только для новой локации
        entry.time,
        entry.operationType
      ]);
    });
    
    // Создаем рабочую книгу и лист
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Устанавливаем ширину столбцов
    const colWidths = [
      { wch: 15 }, // Date
      { wch: 12 }, // Location
      { wch: 10 }, // Time
      { wch: 35 }  // Operation Type
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Объединяем ячейки для заголовка
    worksheet['!merges'] = [
      // Объединяем ячейки для заголовка (A1:D1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      // Объединяем ячейки для периода (A2:D2)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];
    
    // Добавляем стили для центрирования заголовков и добавления границ
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    
    // Центрирование заголовка
    if (!worksheet.A1) worksheet.A1 = { v: 'DP Log - Dina Supporter' };
    worksheet.A1.s = {
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { bold: true, sz: 14 }
    };
    
    // Центрирование периода
    if (!worksheet.A2) worksheet.A2 = { v: `Period: ${formatDate(startDate)} - ${formatDate(endDate)}` };
    worksheet.A2.s = {
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { sz: 12 }
    };
    
    // Добавляем границы для заголовков таблицы (строка 4)
    ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
      if (!worksheet[cell]) worksheet[cell] = {};
      worksheet[cell].s = {
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        },
        font: { bold: true },
        fill: { fgColor: { rgb: 'F2F2F2' } }
      };
    });
    
    // Добавляем границы для ячеек с данными
    for (let row = 5; row < 5 + allTableData.length; row++) {
      ['A', 'B', 'C', 'D'].forEach(col => {
        const cellRef = `${col}${row}`;
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = {
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      });
    }
    
    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DP Log');
    
    // Экспортируем Excel файл
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    // Закрываем диалог
    handleCloseDialog();
  }, [startDate, endDate, paginatedDates, getFilteredEventsForDate, getFilteredLocationsForDate, fileName]);

  return (
    <>
      <Tooltip title="Export to Excel">
        <IconButton
          color="primary" 
          size="large"
          onClick={handleOpenDialog}
          sx={{
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Export DP Log to Excel</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Select date range for export
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <AppDatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date || '')}
              fullWidth
              inputProps={{ min: minDate, max: endDate || maxDate }}
            />
            <AppDatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date || '')}
              fullWidth
              inputProps={{ min: startDate || minDate, max: maxDate }}
            />
          </Box>
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          
          {paginatedDates.length > 0 && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Available date range: {formatDate(minDate)} - {formatDate(maxDate)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleExport} variant="contained" color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExcelExportButton; 