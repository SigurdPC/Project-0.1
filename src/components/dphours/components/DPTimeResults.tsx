import React from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Paper, Divider 
} from '@mui/material';

// Определим тип для результатов операций
export interface OperationTime {
  date: string;
  startTime: string;
  endTime: string;
  shift: string;
  hoursInShift: string;
}

interface DPTimeResultsProps {
  results: OperationTime[];
}

const DPTimeResults: React.FC<DPTimeResultsProps> = ({ results }) => {
  // Группировка результатов по датам
  const resultsByDate = results.reduce((acc, result) => {
    if (!acc[result.date]) {
      acc[result.date] = [];
    }
    acc[result.date].push(result);
    return acc;
  }, {} as Record<string, OperationTime[]>);
  
  return (
    <Box>
      {Object.entries(resultsByDate).map(([date, dateResults]) => (
        <Box key={date} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {date}
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
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
                {dateResults.map((result, index) => (
                  <TableRow key={`${date}-${index}`} hover>
                    <TableCell>{result.startTime}</TableCell>
                    <TableCell>{result.endTime}</TableCell>
                    <TableCell>
                      <Chip 
                        label={result.shift} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell align="right">{result.hoursInShift}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
      
      {results.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Нет данных для отображения
        </Typography>
      )}
      
      <Box sx={{ textAlign: 'center', pt: 2, pb: 1, color: 'text.secondary' }}>
        <Typography variant="body2">
          Конец списка
        </Typography>
      </Box>
    </Box>
  );
};

export default DPTimeResults; 