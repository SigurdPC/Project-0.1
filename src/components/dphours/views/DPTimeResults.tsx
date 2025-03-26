import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { 
  Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Divider, CircularProgress
} from '@mui/material';
import { DPTimeOperation, TimeCalculationResult } from '../types';
import { formatDate } from '../utils';

interface DPTimeResultsProps {
  results: TimeCalculationResult[];
  operations: DPTimeOperation[];
  onBack: () => void;
}

// Вспомогательная функция для форматирования часов и минут
const formatHoursAndMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}ч ${mins}м`;
};

// Тип для группировки данных по операциям
interface GroupedOperation {
  operationId: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  shifts: {
    shiftId: string;
    shiftStart: string;
    shiftEnd: string;
    minutesInShift: number;
  }[];
  totalMinutes: number;
}

const DPTimeResults: React.FC<DPTimeResultsProps> = ({ 
  results, operations, onBack 
}) => {
  // Состояние для бесконечной прокрутки
  const [visibleDatesCount, setVisibleDatesCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastDateElementRef = useRef<HTMLDivElement | null>(null);

  // Получаем уникальные даты из результатов для группировки
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(results.map(result => result.date)));
    return dates.sort();
  }, [results]);

  // Группируем результаты по операциям
  const groupedResults = useMemo(() => {
    // Группируем данные по дате и операции
    const grouped: Record<string, Record<string, GroupedOperation>> = {};
    
    results.forEach(result => {
      const { date, operationId, shiftId, shiftStart, shiftEnd, minutesInShift } = result;
      const operation = operations.find(op => op.id === operationId);
      
      if (!operation) return;
      
      // Инициализируем дату, если она еще не существует
      if (!grouped[date]) {
        grouped[date] = {};
      }
      
      // Инициализируем операцию, если она еще не существует для этой даты
      if (!grouped[date][operationId]) {
        grouped[date][operationId] = {
          operationId,
          location: operation.location,
          startDate: operation.startDate,
          startTime: operation.startTime,
          endDate: operation.endDate,
          endTime: operation.endTime,
          shifts: [],
          totalMinutes: 0
        };
      }
      
      // Добавляем информацию о смене
      grouped[date][operationId].shifts.push({
        shiftId,
        shiftStart,
        shiftEnd,
        minutesInShift
      });
      
      // Увеличиваем общее время операции
      grouped[date][operationId].totalMinutes += minutesInShift;
    });
    
    return grouped;
  }, [results, operations]);

  // Видимые даты
  const visibleDates = useMemo(() => {
    return uniqueDates.slice(0, visibleDatesCount);
  }, [uniqueDates, visibleDatesCount]);

  // Функция для загрузки следующих порций данных
  const loadMoreDates = useCallback(() => {
    if (isLoading || visibleDatesCount >= uniqueDates.length) return;
    
    setIsLoading(true);
    
    // Имитация задержки загрузки для плавности
    setTimeout(() => {
      setVisibleDatesCount(prev => Math.min(prev + 10, uniqueDates.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, visibleDatesCount, uniqueDates.length]);

  // Обработчик пересечения для бесконечной прокрутки
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      loadMoreDates();
    }
  }, [loadMoreDates]);

  // Настройка IntersectionObserver
  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '100px',
      threshold: 0.1
    });

    if (lastDateElementRef.current) {
      observer.current.observe(lastDateElementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleIntersect, visibleDates]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Результаты расчета
      </Typography>
      
      {/* Результаты */}
      {visibleDates.length > 0 ? (
        visibleDates.map((date, index) => {
          // Получаем операции для текущей даты
          const dateOperations = groupedResults[date];
          
          // Пропускаем даты без результатов
          if (!dateOperations || Object.keys(dateOperations).length === 0) return null;
          
          // Определяем, является ли это последним элементом
          const isLastItem = index === visibleDates.length - 1;
          
          return (
            <Box 
              key={date} 
              sx={{ mb: 4 }}
              ref={isLastItem ? lastDateElementRef : null}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                {formatDate(date)}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Начало операции</TableCell>
                      <TableCell>Конец операции</TableCell>
                      <TableCell>Смена</TableCell>
                      <TableCell align="right">Часы в смене</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.values(dateOperations).map((groupedOp) => {
                      return (
                        <TableRow key={groupedOp.operationId}>
                          <TableCell>
                            {formatDate(groupedOp.startDate)} {groupedOp.startTime}
                          </TableCell>
                          <TableCell>
                            {groupedOp.endDate 
                              ? `${formatDate(groupedOp.endDate)} ${groupedOp.endTime || ''}`
                              : 'В процессе'}
                          </TableCell>
                          <TableCell>
                            {groupedOp.shifts.map(shift => (
                              <span 
                                key={shift.shiftId}
                                style={{ 
                                  margin: '0 4px 4px 0',
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '16px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  border: '1px solid #1976d2',
                                  color: '#1976d2'
                                }}
                              >
                                {shift.shiftStart} - {shift.shiftEnd}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatHoursAndMinutes(groupedOp.totalMinutes)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Нет результатов для отображения
        </Typography>
      )}
      
      {/* Индикатор загрузки */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}
      
      {/* Сообщение о конце списка */}
      {!isLoading && visibleDatesCount >= uniqueDates.length && uniqueDates.length > 0 && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ py: 2, textAlign: 'center' }}
        >
          Конец списка
        </Typography>
      )}
    </Paper>
  );
};

export default DPTimeResults; 