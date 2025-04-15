import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Box,
  Typography,
  Divider 
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import { DPHours } from '../types';

interface PDFExportButtonProps {
  paginatedDates: string[];
  getFilteredEventsForDate: (date: string) => DPHours[];
  getFilteredLocationsForDate: (date: string) => string[];
  fileName?: string;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  paginatedDates,
  getFilteredEventsForDate,
  getFilteredLocationsForDate,
  fileName = 'dp-hours-history'
}) => {
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

  const handleExport = () => {
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

    exportToPDF(filteredDates);
    handleCloseDialog();
  };

  const exportToPDF = (datesToExport: string[]) => {
    // Create a new PDF document in portrait mode for A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Экономия чернил - используем более светлые оттенки
    const primaryColor = [41, 128, 185];  // голубой для заголовков
    const secondaryColor = [100, 100, 100]; // серый для вторичного текста
    const dateColor = [0, 0, 0]; // черный для даты (экономия цветных чернил)
    const locationColor = [80, 80, 80]; // темно-серый для локации
    const headerBgColor = [245, 245, 245]; // очень светлый фон (почти белый)
    
    // Константы для таблицы и позиционирования
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 20; // отступ слева 2 см
    const rightMargin = 5; // отступ справа 0.5 см
    const availableWidth = pageWidth - leftMargin - rightMargin;
    
    // Компактный заголовок в одну линию
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('DP Log - Dina Supporter', pageWidth / 2, 12, { align: 'center' });
    
    // Информация о периоде
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(8);
    
    const generatedDate = new Date().toLocaleDateString('en-GB');
    
    let periodText = '';
    if (startDate && endDate) {
      periodText = `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    pdf.text(periodText, pageWidth / 2, 18, { align: 'center' });
    
    // Структура для хранения данных таблицы
    interface TableEntry {
      date: string;
      location: string;
      time: string;
      operationType: string;
    }
    
    // Сбор всех данных для табличного отображения
    const allTableData: TableEntry[] = [];
    
    // Соберем все данные в плоскую таблицу и группируем по дате и локации
    interface GroupedData {
      [dateAndLocation: string]: TableEntry[];
    }
    
    const groupedData: GroupedData = {};
    
    datesToExport.forEach(date => {
      const formattedDate = formatDate(date);
      
      const locations = getFilteredLocationsForDate(date);
      
      locations.forEach(location => {
        const events = getFilteredEventsForDate(date).filter(
          event => event.location === location
        );
        
        // Сортируем события по времени
        const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
        
        const groupKey = `${formattedDate}_${location}`;
        groupedData[groupKey] = sortedEvents.map(event => ({
          date: formattedDate,
          location,
          time: event.time,
          operationType: event.operationType
        }));
        
        // Также добавляем в общий список для сортировки
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
      // Сначала по дате
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Затем по локации
      const locationA = parseInt(a.location) || 0;
      const locationB = parseInt(b.location) || 0;
      const locationCompare = locationA - locationB;
      if (locationCompare !== 0) return locationCompare;
      
      // Наконец по времени
      return a.time.localeCompare(b.time);
    });
    
    if (allTableData.length === 0) {
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No data available for the selected period.', pageWidth / 2, 40, { align: 'center' });
      pdf.save(`${fileName}.pdf`);
      return;
    }
    
    // Настройки отображения - с новым форматом
    const startY = 30; // увеличиваем отступ от заголовка
    const cellPadding = 1; // уменьшаем отступы
    const blockPadding = 5; // отступ между блоками дата+локация
    const lineHeight = 4; // уменьшаем высоту строки
    
    // Начальная позиция контента (с левым отступом)
    const startX = leftMargin;
    
    // Ширина для операции
    const timeWidth = 30; // ширина для времени
    const operationIndent = 10; // отступ для операций
    
    let currentY = startY;
    let currentDate = '';
    
    // Получаем уникальные пары дата+локация
    const uniqueDateLocations = Array.from(new Set(
      allTableData.map(item => `${item.date}_${item.location}`)
    )).sort();
    
    // Отрисовка данных по группам дата+локация
    uniqueDateLocations.forEach((dateLocationKey, groupIndex) => {
      const [date, location] = dateLocationKey.split('_');
      const entriesInGroup = groupedData[dateLocationKey];
      
      if (!entriesInGroup || entriesInGroup.length === 0) return;
      
      // Проверка необходимости новой страницы
      if (currentY > pageHeight - 25) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Добавляем отступ между группами
      if (groupIndex > 0) {
        currentY += 3; // уменьшено с 5 до 3
      }
      
      // Проверяем, нужно ли показывать новую дату (для дополнительного отступа)
      const isNewDate = date !== currentDate;
      if (isNewDate) {
        currentDate = date;
        if (groupIndex > 0) {
          currentY += 2; // уменьшено с 3 до 2
        }
      }
      
      // Дата и локация в одной строке
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(dateColor[0], dateColor[1], dateColor[2]);
      pdf.text(`Date: ${date}`, startX + cellPadding, currentY);
      
      // Локация справа от даты
      pdf.setFontSize(9);
      pdf.setTextColor(locationColor[0], locationColor[1], locationColor[2]);
      pdf.text(`Location: ${location}`, startX + availableWidth / 2, currentY);
      
      // Тонкая линия под датой и локацией
      pdf.setDrawColor(220, 220, 220);
      pdf.line(startX, currentY + 1, startX + availableWidth, currentY + 1);
      
      currentY += 5; // увеличиваем расстояние между линией и первой записью
      
      // Отображаем время и тип операции под датой и локацией
      entriesInGroup.forEach((entry, entryIndex) => {
        // Проверка необходимости новой страницы
        if (currentY > pageHeight - 10) {
          pdf.addPage();
          currentY = 20;
          
          // Повторяем заголовок даты и локации на новой странице без серого фона
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(dateColor[0], dateColor[1], dateColor[2]);
          pdf.text(`Date: ${date}`, startX + cellPadding, currentY);
          
          pdf.setFontSize(9);
          pdf.setTextColor(locationColor[0], locationColor[1], locationColor[2]);
          pdf.text(`Location: ${location}`, startX + availableWidth / 2, currentY);
          
          pdf.setDrawColor(220, 220, 220);
          pdf.line(startX, currentY + 1, startX + availableWidth, currentY + 1);
          
          currentY += 5; // увеличиваем расстояние между линией и первой записью
        }
        
        // Время и тип операции с отступом
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        
        // Время с отступом слева (без надписи "Time:")
        pdf.text(entry.time, startX + operationIndent, currentY);
        
        // Тип операции после времени (без надписи "Operation:")
        pdf.text(entry.operationType, startX + operationIndent + timeWidth + 10, currentY);
        
        currentY += lineHeight; // переход к следующей строке в группе
      });
      
      // Дополнительный отступ после группы
      currentY += 2; // уменьшено с 3 до 2
    });
    
    // Добавляем генерированную дату в нижний правый угол каждой страницы
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(`Generated: ${generatedDate}`, pageWidth - rightMargin, pageHeight - 5, { align: 'right' });
    }
    
    // Save the PDF
    pdf.save(`${fileName}.pdf`);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<PictureAsPdfIcon />}
        onClick={handleOpenDialog}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          px: 2,
        }}
      >
        Export to PDF
      </Button>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Export DP Log</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Select date range for the report
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              inputProps={{ min: minDate, max: endDate || maxDate }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PDFExportButton; 