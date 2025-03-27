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

// Helper function to format hours and minutes
const formatHoursAndMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

// Type for grouping data by operations (instead of days)
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
  // State for infinite scrolling
  const [visibleOperationsCount, setVisibleOperationsCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Group results by operations, not by days
  const groupedOperations = useMemo(() => {
    // First create a dictionary of operations by ID
    const operationsMap: Record<string, OperationGroup> = {};
    
    // Process all results
    results.forEach(result => {
      const { operationId, date, shiftId, shiftStart, shiftEnd, minutesInShift } = result;
      const operation = operations.find(op => op.id === operationId);
      
      if (!operation) return;
      
      // If the operation doesn't exist in the dictionary yet, create it
      if (!operationsMap[operationId]) {
        operationsMap[operationId] = {
          startDate: operation.startDate,
          endDate: operation.endDate || operation.startDate,
          operationId,
          shifts: [],
          totalMinutes: 0
        };
      }
      
      // Add shift information if it doesn't exist yet
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
      
      // Increase the total operation time
      operationsMap[operationId].totalMinutes += minutesInShift;
    });
    
    // Convert dictionary to array and sort by start date
    return Object.values(operationsMap).sort((a, b) => 
      a.startDate > b.startDate ? 1 : a.startDate < b.startDate ? -1 : 0
    );
  }, [results, operations]);

  // Visible operations for infinite scrolling
  const visibleOperations = useMemo(() => {
    return groupedOperations.slice(0, visibleOperationsCount);
  }, [groupedOperations, visibleOperationsCount]);

  // Function to load next batch of data
  const loadMoreOperations = useCallback(() => {
    if (isLoading || visibleOperationsCount >= groupedOperations.length) return;
    
    setIsLoading(true);
    
    // Simulate loading delay for smoothness
    setTimeout(() => {
      setVisibleOperationsCount(prev => Math.min(prev + 10, groupedOperations.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, visibleOperationsCount, groupedOperations.length]);

  // Intersection handler for infinite scrolling
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      loadMoreOperations();
    }
  }, [loadMoreOperations]);

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
  }, [handleIntersect, visibleOperations]);

  return (
    <Box>
      <Typography variant="h5" sx={{ p: 3, pb: 1 }}>
        Calculation Results
      </Typography>
      
      {/* Results */}
      {groupedOperations.length > 0 ? (
        <Box sx={{ maxHeight: '500px', overflow: 'auto', px: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Operation Dates</TableCell>
                  <TableCell>Shifts</TableCell>
                  <TableCell align="right">Total Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleOperations.map((operation, index) => {
                  // Determine if this is the last item
                  const isLastItem = index === visibleOperations.length - 1;
                  
                  // Check if operation lasts more than one day
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
          
          {/* Element for tracking scrolling */}
          {visibleOperations.length > 0 && (
            <Box ref={lastElementRef} sx={{ height: 5, width: '100%' }} />
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          
          {/* End of list message */}
          {!isLoading && visibleOperationsCount >= groupedOperations.length && groupedOperations.length > 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ py: 2, textAlign: 'center' }}
            >
              End of list
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No results to display
        </Typography>
      )}
    </Box>
  );
};

export default DPTimeResults; 