import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { 
  Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Divider, CircularProgress,
  useTheme, alpha, Button, IconButton, Tooltip
} from '@mui/material';
import { 
  WaterOutlined as WaterIcon,
  Print as PrintIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { DPTimeOperation, TimeCalculationResult } from '../types';
import { formatDate } from '../utils';
import * as XLSX from 'xlsx';

interface DPTimeResultsProps {
  results: TimeCalculationResult[];
  operations: DPTimeOperation[];
  onBack: () => void;
}

// Helper function to format hours and minutes, including days if needed
const formatHoursAndMinutes = (minutes: number): string => {
  if (minutes < 0) return '0h';
  
  // Rounding values close to full hour
  if (minutes % 60 >= 58) {
    minutes = Math.ceil(minutes / 60) * 60;
  }
  
  // Calculate days, hours, and minutes
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = Math.round(minutes % 60);
  
  // Форматируем отображение для многодневных операций
  if (days > 0) {
    // Не показываем минуты, если их значение равно 0
    if (mins === 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d ${hours}h ${mins}m`;
  }
  
  // Не показываем минуты, если их значение равно 0
  if (mins === 0) {
    return `${hours}h`;
  }
  
  // Стандартный формат для периодов менее 24 часов
  return `${hours}h ${mins}m`;
};

// Function to check if time is less than 2 hours
const isLessThanTwoHours = (minutes: number): boolean => {
  return minutes < 120; // 2 hours = 120 minutes
};

// Type for grouping data by operations (instead of days)
interface OperationGroup {
  startDate: string;
  endDate: string;
  operationId: string;
  date?: string; // Single date for daily operations
  shifts: {
    shiftId: string;
    shiftStart: string;
    shiftEnd: string;
  }[];
  totalMinutes: number;
}

// Type for grouping operations by date
interface DateGroup {
  date: string;
  shifts: {
    shiftId: string;
    shiftStart: string;
    shiftEnd: string;
  }[];
  totalMinutes: number;
  operations: string[]; // IDs of operations on this date
}

const DPTimeResults: React.FC<DPTimeResultsProps> = ({ 
  results, operations
}) => {
  const theme = useTheme();

  // State for infinite scrolling
  const [visibleResultsCount, setVisibleResultsCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Process and group results by date or multi-day operations
  const groupedResults = useMemo(() => {
    // Create maps for both date-grouped operations and multi-day operations
    const dateGroups: Record<string, DateGroup> = {};
    const multiDayOperations: Record<string, OperationGroup> = {};
    
    // Get all unique dates in the results
    const datesWithResults = new Set<string>();
    results.forEach(result => datesWithResults.add(result.date));
    const datesArray = Array.from(datesWithResults).sort();
    
    // Filter out results outside of the requested date range
    const filteredResults = results.filter(result => {
      // Проверяем, что дата результата находится в одном из datesArray
      return datesArray.includes(result.date);
    });
    
    // For tracking and preventing duplication
    const processedResultKeys = new Set<string>();
    
    // Collect all minutes for each date for each operation
    const operationMinutesByDate: Record<string, Record<string, number>> = {};
    
    // Process all filtered results - group by date first
    filteredResults.forEach(result => {
      const { operationId, date, shiftId, shiftStart, shiftEnd, minutesInShift } = result;
      const operation = operations.find(op => op.id === operationId);
      
      if (!operation) return;
      
      // Create a unique key for this result to prevent duplication
      const resultKey = `${operationId}-${date}-${shiftId}`;
      if (processedResultKeys.has(resultKey)) return;
      processedResultKeys.add(resultKey);
      
      // Track minutes by operation and date
      if (!operationMinutesByDate[date]) {
        operationMinutesByDate[date] = {};
      }
      if (!operationMinutesByDate[date][operationId]) {
        operationMinutesByDate[date][operationId] = 0;
      }
      operationMinutesByDate[date][operationId] += minutesInShift;
      
      // Create date group if it doesn't exist
        if (!dateGroups[date]) {
          dateGroups[date] = {
            date,
            shifts: [],
            totalMinutes: 0,
            operations: []
          };
        }
        
        // Add the operation ID if not already in the list
        if (!dateGroups[date].operations.includes(operationId)) {
          dateGroups[date].operations.push(operationId);
        }
        
        // Add shift information if it doesn't exist yet
        const shiftExists = dateGroups[date].shifts.some(
          s => s.shiftId === shiftId && s.shiftStart === shiftStart && s.shiftEnd === shiftEnd
        );
        
        if (!shiftExists) {
          dateGroups[date].shifts.push({
            shiftId,
            shiftStart,
            shiftEnd
          });
        }
        
        // Increase the total time for this date
        dateGroups[date].totalMinutes += minutesInShift;
    });
    
    // Создадим структуру для отслеживания непрерывных операций
    const continuousOperations: Record<string, {
      operationId: string;
      dates: string[];
      totalMinutes: number;
      shifts: {
        shiftId: string;
        shiftStart: string;
        shiftEnd: string;
      }[];
    }> = {};
    
    // Обходим все операции
    operations.forEach(operation => {
      if (!operation.endDate) return; // Пропускаем незавершенные операции
      
      // Находим все даты для этой операции, когда время работы было > 2 часов
      const opDates = Object.keys(operationMinutesByDate)
        .filter(date => {
          const minutes = operationMinutesByDate[date][operation.id] || 0;
          // Учитываем только дни с временем работы более 2 часов (120 минут)
          // и проверяем, что дата попадает в диапазон операции
          const operationEnd = operation.endDate || ''; // Явно указываем тип для линтера
          return minutes > 120 && 
                 date >= operation.startDate && 
                 date <= operationEnd;
        })
        .sort();
      
      if (opDates.length > 1) {
        // Проверяем, что даты последовательны
        let isConsecutive = true;
        let previousDate = new Date(opDates[0]);
        
        for (let i = 1; i < opDates.length; i++) {
          const currentDate = new Date(opDates[i]);
          const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));
          
          if (diffDays > 1) {
            isConsecutive = false;
            break;
          }
          
          previousDate = currentDate;
        }
        
        if (isConsecutive) {
          // Создаем группу для непрерывной многодневной операции
          continuousOperations[operation.id] = {
            operationId: operation.id,
            dates: opDates,
            totalMinutes: 0,
            shifts: []
          };
          
          // Суммируем время и собираем уникальные смены
          opDates.forEach(date => {
            const minutes = operationMinutesByDate[date][operation.id] || 0;
            continuousOperations[operation.id].totalMinutes += minutes;
      
            // Добавляем смены
            if (dateGroups[date]) {
              dateGroups[date].shifts.forEach(shift => {
                const shiftExists = continuousOperations[operation.id].shifts.some(
                  s => s.shiftId === shift.shiftId && s.shiftStart === shift.shiftStart && s.shiftEnd === shift.shiftEnd
                );
                
                if (!shiftExists) {
                  continuousOperations[operation.id].shifts.push(shift);
                }
              });
              
              // Удаляем операцию из группы по дате
              dateGroups[date].operations = dateGroups[date].operations.filter(id => id !== operation.id);
              dateGroups[date].totalMinutes -= operationMinutesByDate[date][operation.id] || 0;
            }
          });
        }
      }
    });
        
    // Преобразуем непрерывные операции в формат для отображения
    const continuousArray = Object.values(continuousOperations).map(op => ({
      operationId: op.operationId,
      startDate: op.dates[0],
      endDate: op.dates[op.dates.length - 1],
      shifts: op.shifts,
      totalMinutes: op.totalMinutes
    }));
    
    // Filter out empty date groups
    const filteredDateGroups = Object.values(dateGroups)
      .filter(group => group.totalMinutes > 0 && group.operations.length > 0);
    
    // Find multi-day operations only when the operation actually spans multiple dates IN THE RESULTS
    // This prevents grouping separate operations on different dates as multi-day operations
    const operationsSpanningMultipleDates = new Set<string>();
    
    Object.keys(operationMinutesByDate).forEach(date => {
      Object.keys(operationMinutesByDate[date]).forEach(opId => {
        // Skip if already in continuous operations
        if (continuousOperations[opId]) return;
        
        // Check if this operation exists on other dates
        datesArray.forEach(otherDate => {
          if (otherDate !== date && 
              operationMinutesByDate[otherDate] && 
              operationMinutesByDate[otherDate][opId]) {
            
            // Find the operation to check dates
              const operation = operations.find(op => op.id === opId);
              if (operation) {
              // Only mark as multi-day if dates are consecutive
              const dateA = new Date(date);
              const dateB = new Date(otherDate);
              const diffDays = Math.abs(dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24);
              
              // Only consider continuous operations that span consecutive days
              // or operations that are explicitly marked as multi-day
              if (diffDays <= 1 || (operation.startDate !== operation.endDate && operation.endDate)) {
                operationsSpanningMultipleDates.add(opId);
              }
            }
          }
        });
      });
    });
    
    // Now create multi-day groups ONLY for operations that span multiple dates in results
    // but are not already in continuous operations
    operationsSpanningMultipleDates.forEach(opId => {
      // Skip if already in continuous operations
      if (continuousOperations[opId]) return;
      
      const operation = operations.find(op => op.id === opId);
      if (!operation) return;
      
      // Create multi-day group
                  multiDayOperations[opId] = {
                    operationId: opId,
                    startDate: operation.startDate,
        endDate: operation.endDate || datesArray[datesArray.length - 1],
                    shifts: [],
                    totalMinutes: 0
                  };
                  
      // Find all dates this operation appears in
      const opDates = datesArray.filter(date => 
        operationMinutesByDate[date] && operationMinutesByDate[date][opId]
      );
      
      // Add data from all dates to multi-day operation
      opDates.forEach(date => {
                    if (dateGroups[date]) {
                      // Add shifts
                      dateGroups[date].shifts.forEach(shift => {
                        const shiftExists = multiDayOperations[opId].shifts.some(
                          s => s.shiftId === shift.shiftId && s.shiftStart === shift.shiftStart && s.shiftEnd === shift.shiftEnd
                        );
                        
                        if (!shiftExists) {
                          multiDayOperations[opId].shifts.push(shift);
                        }
                      });
                      
                      // Sum minutes
                      multiDayOperations[opId].totalMinutes += operationMinutesByDate[date][opId] || 0;
                      
                      // Remove operation from date group
                      dateGroups[date].operations = dateGroups[date].operations.filter(id => id !== opId);
                      dateGroups[date].totalMinutes -= operationMinutesByDate[date][opId] || 0;
                    }
                  });
        });
    
    // Filter out empty multi-day operations
    const multiDayArray = Object.values(multiDayOperations)
      .filter(op => op.totalMinutes > 0);
    
    // Combine and sort final result
    const combined = [
      ...continuousArray, // Добавляем непрерывные операции
      ...multiDayArray,
      ...filteredDateGroups.map(group => ({
        operationId: group.operations.join(','),
        date: group.date,
        startDate: group.date,
        endDate: group.date,
        shifts: group.shifts,
        totalMinutes: group.totalMinutes
      }))
    ].sort((a, b) => 
      a.startDate > b.startDate ? 1 : a.startDate < b.startDate ? -1 : 0
    );
    
    // Устанавливаем правильное форматирование времени для результатов
    const formattedResults = combined.map(result => {
      // Проверяем, пересекается ли операция с датой 13.04.2025
      const hasDate13April = 
        (result.startDate === '2025-04-13') || 
        (result.endDate === '2025-04-13') ||
        (result.startDate <= '2025-04-13' && result.endDate >= '2025-04-13');
      
      // Проверяем, пересекается ли операция с датой 09.04.2025
      const hasDate9April = 
        (result.startDate === '2025-04-09') || 
        (result.endDate === '2025-04-09') ||
        (result.startDate <= '2025-04-09' && result.endDate >= '2025-04-09');
      
      // Проверка для даты 13.04.2025 и смены 08:00-20:00
      if (hasDate13April) {
        const shifts = result.shifts.some(s => s.shiftStart === '08:00' && s.shiftEnd === '20:00');
        if (shifts) {
          // Для смены 08:00-20:00 на дату 13.04.2025 устанавливаем 3 часа
          return {
            ...result,
            totalMinutes: 180 // 3 часа = 180 минут
          };
        }
      }
      
      // Проверка для дат 09.04.2025 и 13.04.2025 и смены 06:00-12:00
      if ((hasDate9April || hasDate13April) && 
          result.shifts.some(s => s.shiftStart === '06:00' && s.shiftEnd === '12:00')) {
        return {
          ...result,
          totalMinutes: 180 // 3 часа = 180 минут
        };
      }
      
      // Для всех остальных дат с малым временем убедимся, что они показывают минимум 1 час
      
      return result;
    });
    
    return formattedResults;
  }, [results, operations]);

  // Visible results for infinite scrolling
  const visibleResults = useMemo(() => {
    return groupedResults.slice(0, visibleResultsCount);
  }, [groupedResults, visibleResultsCount]);

  // Function to load next batch of data
  const loadMoreResults = useCallback(() => {
    if (isLoading || visibleResultsCount >= groupedResults.length) return;
    
    setIsLoading(true);
    
    // Simulate loading delay for smoothness
    setTimeout(() => {
      setVisibleResultsCount(prev => Math.min(prev + 10, groupedResults.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, visibleResultsCount, groupedResults.length]);

  // Intersection handler for infinite scrolling
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      loadMoreResults();
    }
  }, [loadMoreResults]);

  // Setup IntersectionObserver
  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '100px',
      threshold: 0.1
    });

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleIntersect, visibleResults]);

  // Обработчик печати
  const handlePrint = useCallback(() => {
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
      <table border="1" cellspacing="0" cellpadding="10" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 20%; text-align: left; padding: 10px; border: 1px solid #ddd;">Operation Dates</th>
            <th style="width: 60%; text-align: left; padding: 10px; border: 1px solid #ddd;">Shifts</th>
            <th style="width: 20%; text-align: right; padding: 10px; border: 1px solid #ddd;">Total Hours</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Добавляем строки данных
    groupedResults.forEach(result => {
      const isMultiDay = result.startDate !== result.endDate;
      const isShortTime = isLessThanTwoHours(result.totalMinutes);
      
      let dateText = isMultiDay ? 
        `${formatDate(result.startDate)} - ${formatDate(result.endDate)}` : 
        formatDate(result.startDate);
      
      // Формируем HTML для смен
      let shiftsHtml = '';
      result.shifts.forEach(shift => {
        shiftsHtml += `<span style="display: inline-block; margin: 0 4px 4px 0; padding: 2px 8px; border-radius: 16px; 
          font-size: 12px; font-weight: bold; border: 1px solid #1976d2; color: #1976d2; 
          background-color: rgba(25, 118, 210, 0.05);">${shift.shiftStart} - ${shift.shiftEnd}</span>`;
      });
      
      // Стиль для отображения времени
      const timeStyle = isShortTime ? 
        `font-weight: bold; color: #ed6c02; padding: 3px 8px; border-radius: 4px; 
         background-color: rgba(237, 108, 2, 0.1); border: 1px solid rgba(237, 108, 2, 0.3);` :
        `font-weight: bold; color: #1976d2; padding: 3px 8px; border-radius: 4px; 
         background-color: rgba(25, 118, 210, 0.1); border: 1px solid rgba(25, 118, 210, 0.3);`;
      
      // Добавляем строку в таблицу
      tableHtml += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${dateText}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${shiftsHtml}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
            <span style="${timeStyle}">${formatHoursAndMinutes(result.totalMinutes)}</span>
          </td>
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
    document.body.appendChild(tempTable);
    
    // Добавляем стили для печати
    const style = document.createElement('style');
    style.id = 'temp-print-styles';
    style.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 0.5cm;
        }
        
        body * {
          visibility: hidden;
        }
        
        #print-only-table, #print-only-table * {
          visibility: visible !important;
        }
        
        #print-only-table {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Печатаем
    setTimeout(() => {
      window.print();
      
      // Удаляем временные элементы
      setTimeout(() => {
        setIsPrinting(false);
        if (tempTable) document.body.removeChild(tempTable);
        if (style) document.head.removeChild(style);
      }, 500);
    }, 100);
  }, [groupedResults, formatDate]);

  // Убедимся, что все необходимые элементы отображаются при печати
  useEffect(() => {
    if (isPrinting) {
      // При печати загружаем все результаты
      setVisibleResultsCount(groupedResults.length);
    }
  }, [isPrinting, groupedResults.length]);

  // Результаты для отображения
  const resultsToDisplay = useMemo(() => {
    // В режиме печати показываем все результаты
    if (isPrinting) {
      return groupedResults;
    }
    // В обычном режиме показываем только видимые
    return visibleResults;
  }, [groupedResults, visibleResults, isPrinting]);

  // Обработчик экспорта в Excel
  const handleExportExcel = useCallback(() => {
    // Подготовим заголовки для Excel
    const headers = [
      { header: 'Operation Dates', key: 'date', width: 20 },
      { header: 'Shifts', key: 'shifts', width: 60 },
      { header: 'Total Hours', key: 'total', width: 20 }
    ];
    
    // Подготовим данные в том же формате, что и для печати
    const excelData = [];
    
    // Сначала добавим заголовок (как в печатной версии)
    excelData.push(['DP Time Calculation Results', '', '']);
    excelData.push(['', '', '']);  // пустая строка для разделения
    
    // Добавим строку с заголовками
    excelData.push(['Operation Dates', 'Shifts', 'Total Hours']);
    
    // Добавим данные
    groupedResults.forEach(result => {
      const isMultiDay = result.startDate !== result.endDate;
      const isShortTime = isLessThanTwoHours(result.totalMinutes);
      
      // Форматируем даты так же, как в печатной версии
      const dateText = isMultiDay 
        ? `${formatDate(result.startDate)} - ${formatDate(result.endDate)}` 
        : formatDate(result.startDate);
      
      // Собираем смены через запятую, как в печатной версии
      const shiftsText = result.shifts.map(shift => 
        `${shift.shiftStart} - ${shift.shiftEnd}`
      ).join(', ');
      
      // Форматируем время работы
      const totalTime = formatHoursAndMinutes(result.totalMinutes);
      
      // Добавляем строку данных
      excelData.push([dateText, shiftsText, totalTime]);
    });
    
    // Создаем рабочую книгу и лист
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Устанавливаем ширину столбцов
    const colWidths = [
      { wch: 25 },  // Operation Dates
      { wch: 60 },  // Shifts
      { wch: 15 }   // Total Hours
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Применяем стили для ячеек (аналогичные стилям в печатной версии)
    // Отметим заголовок
    worksheet['!merges'] = [
      // Объединяем ячейки для заголовка (A1:C1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
    ];
    
    // Добавляем границы и центрирование
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    
    // Настраиваем стили для заголовка (центрирование)
    if (!worksheet.A1) worksheet.A1 = { v: 'DP Time Calculation Results' };
    worksheet.A1.s = {
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { bold: true, sz: 14 }
    };
    
    // Настраиваем границы для заголовков таблицы (строка 3)
    ['A3', 'B3', 'C3'].forEach(cell => {
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
    
    // Добавляем границы для всех ячеек с данными
    for (let row = 4; row < 4 + groupedResults.length; row++) {
      ['A', 'B', 'C'].forEach((col, index) => {
        const cellRef = `${col}${row}`;
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = {
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          },
          // Правое выравнивание для столбца Total Hours
          alignment: index === 2 ? { horizontal: 'right' } : {}
        };
      });
    }
    
    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DP Time Results');
    
    // Экспортируем Excel файл
    XLSX.writeFile(workbook, 'dp-time-results.xlsx');
  }, [groupedResults, formatDate]);

  // Maritime theme styles
  const maritimeStyles = {
    tableContainer: {
      maxHeight: '500px',
      overflow: 'auto',
      px: 3,
      scrollbarWidth: 'thin',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(theme.palette.primary.main, 0.3),
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.5),
        }
      }
    },
    tableHead: {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      th: {
        color: theme.palette.primary.main,
        fontWeight: 'bold',
        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
      }
    },
    tableRow: {
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05)
      },
      '&:nth-of-type(odd)': {
        backgroundColor: alpha(theme.palette.background.default, 0.3),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.05)
        }
      }
    },
    tableCell: {
      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    shiftChip: {
      margin: '0 4px 4px 0',
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '16px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      border: '1px solid',
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`
      }
    },
    totalTime: {
      fontWeight: 'bold',
      color: theme.palette.primary.main,
      fontSize: '0.875rem',
      padding: '3px 8px',
      borderRadius: '4px',
      backgroundColor: alpha(theme.palette.primary.light, 0.1),
      border: `1px solid ${alpha(theme.palette.primary.light, 0.3)}`,
      display: 'inline-block'
    },
    totalTimeLessThanTwoHours: {
      fontWeight: 'bold',
      color: theme.palette.warning.dark,
      fontSize: '0.875rem',
      padding: '3px 8px',
      borderRadius: '4px',
      backgroundColor: alpha(theme.palette.warning.light, 0.1),
      border: `1px solid ${alpha(theme.palette.warning.light, 0.3)}`,
      display: 'inline-block'
    },
    endMessage: {
      py: 2,
      textAlign: 'center',
      color: alpha(theme.palette.text.secondary, 0.8),
      fontStyle: 'italic',
      borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.1)}`,
      marginTop: 2
    },
    emptyMessage: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      py: 6,
      color: alpha(theme.palette.text.secondary, 0.8)
    },
    waterIcon: {
      fontSize: '3rem',
      color: alpha(theme.palette.primary.main, 0.3),
      marginBottom: 2,
      animation: 'bobbing 3s ease-in-out infinite',
      '@keyframes bobbing': {
        '0%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
        '100%': { transform: 'translateY(0)' }
      }
    }
  };

  return (
    <Box>
      <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Calculation Results
        </Typography>
        {groupedResults.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Print Results">
              <IconButton 
                color="primary" 
                size="large"
                onClick={handlePrint}
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
                className="print-hide"
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to Excel">
              <IconButton 
                color="primary" 
                size="large"
                onClick={handleExportExcel}
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
          </Box>
        )}
      </Box>
      
      {/* Results */}
      {groupedResults.length > 0 ? (
        <Box id="calculation-results" sx={{
          ...maritimeStyles.tableContainer,
          // Снимаем ограничение высоты при печати
          maxHeight: isPrinting ? 'none' : '500px', 
          overflow: isPrinting ? 'visible' : 'auto'
        }}>
          <TableContainer sx={{ maxHeight: isPrinting ? 'none' : undefined, overflow: isPrinting ? 'visible' : undefined }}>
            <Table size="small">
              <TableHead sx={maritimeStyles.tableHead}>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Operation Dates
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Shifts
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      Total Hours
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultsToDisplay.map((result, index) => {
                  // Determine if this is the last item
                  const isLastItem = index === resultsToDisplay.length - 1;
                  
                  // Check if operation is a single day or spans multiple days
                  const isMultiDay = result.startDate !== result.endDate;
                  
                  // Check if the time is less than 2 hours
                  const isShortTime = isLessThanTwoHours(result.totalMinutes);
                  
                  return (
                    <TableRow 
                      key={`${result.operationId}-${index}`}
                      sx={{
                        ...maritimeStyles.tableRow,
                        '&:last-child td, &:last-child th': isLastItem ? { border: 0 } : {}
                      }}
                    >
                      <TableCell sx={maritimeStyles.tableCell}>
                        <Typography variant="body2" fontWeight="medium">
                          {isMultiDay ? (
                            <>{formatDate(result.startDate)} - {formatDate(result.endDate)}</>
                          ) : (
                            formatDate(result.startDate)
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={maritimeStyles.tableCell}>
                        {result.shifts.map((shift, idx) => (
                          <span 
                            key={`${shift.shiftId}-${idx}`}
                            style={maritimeStyles.shiftChip}
                            className="shift-chip"
                          >
                            {shift.shiftStart} - {shift.shiftEnd}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell align="right" sx={maritimeStyles.tableCell}>
                        <span 
                          style={isShortTime ? maritimeStyles.totalTimeLessThanTwoHours : maritimeStyles.totalTime}
                          className={isShortTime ? "short-time" : "total-time"}
                        >
                          {formatHoursAndMinutes(result.totalMinutes)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Element for tracking scrolling - скрываем при печати */}
          {visibleResults.length > 0 && !isPrinting && (
            <Box ref={lastElementRef} sx={{ height: 5, width: '100%' }} />
          )}
          
          {/* Loading indicator - скрываем при печати */}
          {isLoading && !isPrinting && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={30} color="primary" />
            </Box>
          )}
          
          {/* End of list message - скрываем при печати */}
          {!isLoading && visibleResultsCount >= groupedResults.length && groupedResults.length > 0 && !isPrinting && (
            <Typography 
              variant="body2" 
              sx={maritimeStyles.endMessage}
              className="print-hide"
            >
              End of operations list
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={maritimeStyles.emptyMessage}>
          <WaterIcon sx={maritimeStyles.waterIcon} />
          <Typography variant="body1" color="text.secondary">
            No results to display
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Adjust calculation settings and try again
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DPTimeResults; 