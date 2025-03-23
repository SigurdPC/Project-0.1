import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, FormControlLabel, Checkbox, TextField, Box, Typography,
  Divider, Switch
} from '@mui/material';
import { DateRangeState } from '../utils/types';
import { DPHours } from '../components/Timeline';

// Интерфейс для сессии DP
export interface DPSession {
  date: string;
  location: string;
  startTime: string;
  startEvent: DPHours;
  endTime: string | null;
  endEvent: DPHours | null;
  complete: boolean;
}

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  dpSessions: DPSession[];
  dateRange: DateRangeState;
  onDateRangeChange: (dateRange: DateRangeState) => void;
  onUpdate: () => void;
}

// Функция для расчета продолжительности между временами в формате HH:MM
const calculateDuration = (startTime: string, endTime: string | null): number => {
  if (!endTime) return 0;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;
  
  return endTotalMinutes - startTotalMinutes;
};

// Форматирование продолжительности в часы и минуты
const formatDuration = (durationMinutes: number): string => {
  if (durationMinutes <= 0) return '00:00';
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const StatsDialog: React.FC<StatsDialogProps> = ({ 
  open, 
  onClose, 
  dpSessions,
  dateRange,
  onDateRangeChange,
  onUpdate
}) => {
  // Состояние для временного хранения диапазона дат
  const [tempDateRange, setTempDateRange] = useState<DateRangeState>(dateRange);
  
  // Функция для изменения временного диапазона дат
  const handleTempDateRangeChange = (field: keyof DateRangeState, value: string | boolean) => {
    setTempDateRange({
      ...tempDateRange,
      [field]: value
    });
  };
  
  // Функция для применения изменений диапазона дат
  const handleApplyDateRange = () => {
    onDateRangeChange(tempDateRange);
    onUpdate();
  };
  
  // Расчет общей продолжительности всех сессий
  const totalDuration = dpSessions.reduce((total, session) => {
    const duration = calculateDuration(session.startTime, session.endTime);
    return total + (duration > 0 ? duration : 0);
  }, 0);
  
  // Расчет общей продолжительности завершенных сессий
  const completeDuration = dpSessions
    .filter(session => session.complete)
    .reduce((total, session) => {
      const duration = calculateDuration(session.startTime, session.endTime);
      return total + duration;
    }, 0);
  
  // Количество различных локаций в сессиях
  const uniqueLocations = new Set(dpSessions.map(session => session.location)).size;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>DP Statistics</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Date Range Filter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={tempDateRange.start}
              onChange={(e) => handleTempDateRangeChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={tempDateRange.end}
              onChange={(e) => handleTempDateRangeChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleApplyDateRange}
              sx={{ height: 'fit-content', alignSelf: 'center' }}
            >
              Apply
            </Button>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={tempDateRange.useTimeFilter}
                onChange={(e) => handleTempDateRangeChange('useTimeFilter', e.target.checked)}
              />
            }
            label="Filter by time range"
          />
          
          {tempDateRange.useTimeFilter && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <TextField
                label="Start Time"
                type="time"
                value={tempDateRange.startTime}
                onChange={(e) => handleTempDateRangeChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={tempDateRange.endTime}
                onChange={(e) => handleTempDateRangeChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
              <Typography variant="h5">{dpSessions.length}</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Complete Sessions</Typography>
              <Typography variant="h5">{dpSessions.filter(s => s.complete).length}</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Incomplete Sessions</Typography>
              <Typography variant="h5">{dpSessions.filter(s => !s.complete).length}</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Unique Locations</Typography>
              <Typography variant="h5">{uniqueLocations}</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Duration</Typography>
              <Typography variant="h5">{formatDuration(totalDuration)}</Typography>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Complete Duration</Typography>
              <Typography variant="h5">{formatDuration(completeDuration)}</Typography>
            </Paper>
          </Box>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          DP Sessions
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dpSessions.map((session, index) => {
                const duration = calculateDuration(session.startTime, session.endTime);
                
                return (
                  <TableRow key={index}>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>{session.startTime}</TableCell>
                    <TableCell>{session.endTime || 'N/A'}</TableCell>
                    <TableCell>{duration > 0 ? formatDuration(duration) : 'N/A'}</TableCell>
                    <TableCell>
                      {session.complete ? (
                        <span style={{ color: 'green' }}>Complete</span>
                      ) : (
                        <span style={{ color: 'orange' }}>Incomplete</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {dpSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No DP sessions found for the selected date range
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatsDialog; 