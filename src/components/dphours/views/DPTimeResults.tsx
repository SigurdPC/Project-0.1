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

// Тип для группировки данных по операциям (вместо дней)
interface OperationGroup {
  startDate: string;
  endDate: string;
  operationId: string;
  shifts: {
    shiftId: string;
    shiftStart: string;
    shiftEnd: string;
  }[];
  totalMinutes: number;
}

const DPTimeResults: React.FC<DPTimeResultsProps> = ({ 
  results, operations
}) => {
  // Состояние для бесконечной прокрутки
  const [visibleOperationsCount, setVisibleOperationsCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Группируем результаты по операциям, а не по дням
  const groupedOperations = useMemo(() => {
    // Сначала создадим словарь операций по ID
    const operationsMap: Record<string, OperationGroup> = {};
    
    // Проходим по всем результатам
    results.forEach(result => {
      const { operationId, date, shiftId, shiftStart, shiftEnd, minutesInShift } = result;
      const operation = operations.find(op => op.id === operationId);
      
      if (!operation) return;
      
      // Если операции еще нет в словаре, создаем её
      if (!operationsMap[operationId]) {
        operationsMap[operationId] = {
          startDate: operation.startDate,
          endDate: operation.endDate || operation.startDate,
          operationId,
          shifts: [],
          totalMinutes: 0
        };
      }
      
      // Добавляем информацию о смене, если такой еще нет
      const shiftExists = operationsMap[operationId].shifts.some(
        s => s.shiftId === shiftId && s.shiftStart === shiftStart && s.shiftEnd === shiftEnd
      );
      
      if (!shiftExists) {
        operationsMap[operationId].shifts.push({
          shiftId,
          shiftStart,
          shiftEnd
        });
      }
      
      // Увеличиваем общее время операции
      operationsMap[operationId].totalMinutes += minutesInShift;
    });
    
    // Преобразуем словарь в массив и сортируем по дате начала
    return Object.values(operationsMap).sort((a, b) => 
      a.startDate > b.startDate ? 1 : a.startDate < b.startDate ? -1 : 0
    );
  }, [results, operations]);

  // Видимые операции для бесконечной прокрутки
  const visibleOperations = useMemo(() => {
    return groupedOperations.slice(0, visibleOperationsCount);
  }, [groupedOperations, visibleOperationsCount]);

  // Функция для загрузки следующих порций данных
  const loadMoreOperations = useCallback(() => {
    if (isLoading || visibleOperationsCount >= groupedOperations.length) return;
    
    setIsLoading(true);
    
    // Имитация задержки загрузки для плавности
    setTimeout(() => {
      setVisibleOperationsCount(prev => Math.min(prev + 10, groupedOperations.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, visibleOperationsCount, groupedOperations.length]);

  // Обработчик пересечения для бесконечной прокрутки
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      loadMoreOperations();
    }
  }, [loadMoreOperations]);

  // Настройка IntersectionObserver
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
  }, [handleIntersect, visibleOperations]);

  return (
    <Box>
      <Typography variant="h5" sx={{ p: 3, pb: 1 }}>
        Результаты расчета
      </Typography>
      
      {/* Результаты */}
      {groupedOperations.length > 0 ? (
        <Box sx={{ maxHeight: '500px', overflow: 'auto', px: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Даты операции</TableCell>
                  <TableCell>Смены</TableCell>
                  <TableCell align="right">Всего часов</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleOperations.map((operation, index) => {
                  // Определяем, является ли это последним элементом
                  const isLastItem = index === visibleOperations.length - 1;
                  
                  // Проверяем, длится ли операция более одного дня
                  const isMultiDay = operation.startDate !== operation.endDate;
                  
                  return (
                    <TableRow 
                      key={operation.operationId}
                      sx={isLastItem ? { '&:last-child td, &:last-child th': { border: 0 } } : {}}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(operation.startDate)}
                          {isMultiDay && (
                            <> - {formatDate(operation.endDate)}</>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {operation.shifts.map((shift, idx) => (
                          <span 
                            key={`${shift.shiftId}-${idx}`}
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
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {formatHoursAndMinutes(operation.totalMinutes)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Элемент для отслеживания прокрутки */}
          {visibleOperations.length > 0 && (
            <Box ref={lastElementRef} sx={{ height: 5, width: '100%' }} />
          )}
          
          {/* Индикатор загрузки */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          
          {/* Сообщение о конце списка */}
          {!isLoading && visibleOperationsCount >= groupedOperations.length && groupedOperations.length > 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ py: 2, textAlign: 'center' }}
            >
              Конец списка
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Нет результатов для отображения
        </Typography>
      )}
    </Box>
  );
};

export default DPTimeResults; 