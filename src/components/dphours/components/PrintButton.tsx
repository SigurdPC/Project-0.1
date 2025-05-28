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
import PrintIcon from '@mui/icons-material/Print';
import { DPHours } from '../types';
import AppDatePicker from '../../common/AppDatePicker';

interface PrintButtonProps {
  paginatedDates: string[];
  getFilteredEventsForDate: (date: string) => DPHours[];
  getFilteredLocationsForDate: (date: string) => string[];
  fileName?: string;
  isNightMode: boolean;
}

const PrintButton: React.FC<PrintButtonProps> = ({
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
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handlePrint = useCallback(() => {
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
    
    // Устанавливаем режим печати
    setIsPrinting(true);
    
    // Создадим временную скрытую таблицу только для печати
    const tempTable = document.createElement('div');
    tempTable.id = 'print-only-table';
    tempTable.style.display = 'none';
    tempTable.style.position = 'absolute';
    tempTable.style.left = '0';
    tempTable.style.top = '0';
    tempTable.style.width = '100%';
    
    // Создаем HTML таблицу для печати
    let tableHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #000000; font-weight: bold;">DP Log - Dina Supporter</h2>
        <p style="margin: 5px 0; color: #000000;">Period: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
      </div>
      <table border="1" cellspacing="0" cellpadding="10" style="width:95%; border-collapse: collapse; color: #000000; margin-left: auto; margin-right: auto; font-size: 11px;">
        <thead>
          <tr style="background-color: #f2f2f2; color: #000000;">
            <th style="width: 20%; text-align: left; padding: 8px; border: 1px solid #000000; font-weight: bold;">Date</th>
            <th style="width: 15%; text-align: left; padding: 8px; border: 1px solid #000000; font-weight: bold;">Location</th>
            <th style="width: 20%; text-align: left; padding: 8px; border: 1px solid #000000; font-weight: bold;">Time</th>
            <th style="width: 45%; text-align: left; padding: 8px; border: 1px solid #000000; font-weight: bold;">Operation Type</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Соберем все данные в плоскую таблицу
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
      tempTable.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <p style="color: #000000; font-style: italic; font-weight: bold;">No data available for the selected period.</p>
        </div>
      `;
    } else {
      // Добавляем строки данных
      let currentDate = '';
      let currentLocation = '';
      
      allTableData.forEach((entry, index) => {
        const isNewDate = entry.date !== currentDate;
        const isNewLocation = isNewDate || entry.location !== currentLocation;
        
        currentDate = entry.date;
        currentLocation = entry.location;
        
        // Добавляем строку в таблицу
        tableHtml += `
          <tr style="border-bottom: 1px solid #000000;">
            <td style="padding: 6px 8px; border: 1px solid #000000; text-align: left; color: #000000; font-weight: ${isNewDate ? 'bold' : 'normal'};">${isNewDate ? entry.date : ''}</td>
            <td style="padding: 6px 8px; border: 1px solid #000000; text-align: left; color: #000000; font-weight: ${isNewLocation ? 'bold' : 'normal'};">${isNewLocation ? entry.location : ''}</td>
            <td style="padding: 6px 8px; border: 1px solid #000000; text-align: left; color: #000000;">${entry.time}</td>
            <td style="padding: 6px 8px; border: 1px solid #000000; text-align: left; color: #000000;">${entry.operationType}</td>
          </tr>
        `;
      });
      
      // Закрываем таблицу
      tableHtml += `
          </tbody>
        </table>
      `;
      
      // Добавляем таблицу в DOM
      tempTable.innerHTML = tableHtml;
    }
    
    document.body.appendChild(tempTable);
    
    // Добавляем стили для печати
    const style = document.createElement('style');
    style.id = 'temp-print-styles';
    style.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 1cm;
          margin-left: 2cm;
          margin-top: 0.5cm;
          margin-bottom: 0.5cm;
          marks: none;
        }
        
        @page :first {
          margin-top: 0.5cm;
          margin-left: 2cm;
        }
        
        body * {
          visibility: hidden;
        }
        
        #print-only-table, #print-only-table * {
          visibility: visible !important;
          color: #000000 !important;
          font-size: 11px !important;
        }
        
        #print-only-table {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          padding-left: 0.5cm !important;
        }
        
        #print-only-table table {
          border-collapse: collapse !important;
          width: 95% !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        
        #print-only-table th, #print-only-table td {
          border: 1px solid #000000 !important;
          padding: 6px 8px !important; 
          text-align: left !important;
        }
        
        #print-only-table th {
          padding: 8px !important;
          font-weight: bold !important;
          background-color: #f2f2f2 !important;
        }
        
        #print-only-table h2 {
          font-size: 16px !important;
        }
        
        #print-only-table p {
          font-size: 12px !important;
        }
        
        /* Hide headers and footers */
        html {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        /* Specific browser rules for header/footer removal */
        @supports (-webkit-appearance:none) {
          header, footer, .header, .footer { 
            display: none !important;
          }
          
          html {
            -webkit-appearance: none !important;
          }
        }

        /* Firefox */
        @-moz-document url-prefix() {
          @page {
            margin: 0.5cm !important;
            margin-left: 2cm !important;
            size: A4 !important;
          }
          body { 
            margin: 0 !important;
            padding-left: 0.5cm !important;
          }
        }
      }
    `;
    
    // Add additional script to help with header/footer hiding
    const script = document.createElement('script');
    script.id = 'print-script';
    script.innerHTML = `
      function beforePrint() {
        // Force some browsers to respect the print settings
        document.title = ' ';  // Empty title can help hide headers in some browsers
      }
      window.onbeforeprint = beforePrint;
    `;
    document.head.appendChild(style);
    document.head.appendChild(script);
    
    // Печатаем
    setTimeout(() => {
      window.print();
      
      // Удаляем временные элементы
      setTimeout(() => {
        setIsPrinting(false);
        if (tempTable) document.body.removeChild(tempTable);
        if (style) document.head.removeChild(style);
        if (script) document.head.removeChild(script);
        handleCloseDialog();
      }, 500);
    }, 100);
  }, [paginatedDates, startDate, endDate, getFilteredEventsForDate, getFilteredLocationsForDate]);

  return (
    <>
      <Tooltip title="Print DP Log">
        <IconButton
          color="primary" 
          size="large"
          onClick={handleOpenDialog}
          sx={{
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
            '@media print': {
              display: 'none'
            }
          }}
        >
          <PrintIcon />
        </IconButton>
      </Tooltip>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Print DP Log</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Select date range for printing
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
          <Button onClick={handlePrint} variant="contained" color="primary">
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrintButton; 