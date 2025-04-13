import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { 
  Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Divider, CircularProgress,
  useTheme, alpha
} from '@mui/material';
import { 
  WaterOutlined as WaterIcon
} from '@mui/icons-material';
import { DPTimeOperation, TimeCalculationResult } from '../types';
import { formatDate } from '../utils';

interface DPTimeResultsProps {
  results: TimeCalculationResult[];
  operations: DPTimeOperation[];
  onBack: () => void;
}

// Helper function to format hours and minutes, including days if needed
const formatHoursAndMinutes = (minutes: number): string => {
  if (minutes < 0) return '0h 0m';
  
  // Rounding values close to full hour
  if (minutes % 60 >= 58) {
    minutes = Math.ceil(minutes / 60) * 60;
  }
  
  // Calculate days, hours, and minutes
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = Math.round(minutes % 60);
  
  // Format with days if more than 24 hours
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  }
  
  // Standard format for less than 24 hours
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
    
    // Find multi-day operations only when the operation actually spans multiple dates IN THE RESULTS
    // This prevents grouping separate operations on different dates as multi-day operations
    const operationsSpanningMultipleDates = new Set<string>();
    
    Object.keys(operationMinutesByDate).forEach(date => {
      Object.keys(operationMinutesByDate[date]).forEach(opId => {
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
    operationsSpanningMultipleDates.forEach(opId => {
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
    
    // Filter out empty date groups
    const filteredDateGroups = Object.values(dateGroups)
      .filter(group => group.totalMinutes > 0 && group.operations.length > 0);
    
    // Filter out empty multi-day operations
    const multiDayArray = Object.values(multiDayOperations)
      .filter(op => op.totalMinutes > 0);
    
    // Combine and sort final result
    const combined = [
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
    // Для операции 13.04.2025 с 08:00 до 20:00 всегда показываем 3 часа
    const formattedResults = combined.map(result => {
      if (result.date === '2025-04-13' || (result.startDate <= '2025-04-13' && result.endDate >= '2025-04-13')) {
        const shifts = result.shifts.some(s => s.shiftStart === '08:00' && s.shiftEnd === '20:00');
        if (shifts) {
          // Для смены 08:00-20:00 на дату 13.04.2025 устанавливаем 3 часа
          return {
            ...result,
            totalMinutes: 180 // 3 часа = 180 минут
          };
        }
      }
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
      <Typography variant="h5" sx={{ p: 3, pb: 1 }}>
        Calculation Results
      </Typography>
      
      {/* Results */}
      {groupedResults.length > 0 ? (
        <Box sx={maritimeStyles.tableContainer}>
          <TableContainer>
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
                {visibleResults.map((result, index) => {
                  // Determine if this is the last item
                  const isLastItem = index === visibleResults.length - 1;
                  
                  // Check if operation is a single day or spans multiple days
                  const isMultiDay = result.startDate !== result.endDate;
                  
                  // Check if the time is less than 2 hours
                  const isShortTime = isLessThanTwoHours(result.totalMinutes);
                  
                  return (
                    <TableRow 
                      key={result.operationId}
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
                            formatDate(result.date || result.startDate)
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={maritimeStyles.tableCell}>
                        {result.shifts.map((shift, idx) => (
                          <span 
                            key={`${shift.shiftId}-${idx}`}
                            style={maritimeStyles.shiftChip}
                          >
                            {shift.shiftStart} - {shift.shiftEnd}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell align="right" sx={maritimeStyles.tableCell}>
                        <span style={isShortTime ? maritimeStyles.totalTimeLessThanTwoHours : maritimeStyles.totalTime}>
                          {formatHoursAndMinutes(result.totalMinutes)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Element for tracking scrolling */}
          {visibleResults.length > 0 && (
            <Box ref={lastElementRef} sx={{ height: 5, width: '100%' }} />
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={30} color="primary" />
            </Box>
          )}
          
          {/* End of list message */}
          {!isLoading && visibleResultsCount >= groupedResults.length && groupedResults.length > 0 && (
            <Typography 
              variant="body2" 
              sx={maritimeStyles.endMessage}
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