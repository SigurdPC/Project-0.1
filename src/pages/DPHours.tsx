import React, { useState, useMemo, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, Tabs, Tab, List, ListItem, ListItemText, 
  ListItemSecondaryAction, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, 
  MenuItem, Divider, Grid,
  Collapse, FormControlLabel, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Today as TodayIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import dphoursApi, { DPHours as APIDPHours } from '../api/dphoursApi';

// Define operation type
type OperationType = 'DP Setup' | 'Moving in' | 'Handling Offshore' | 'Pulling Out' | 'DP OFF';

// Define DPHours interface
interface DPHours {
  id: string;
  _id?: string; // MongoDB ID
  date: string;
  location: string;
  operationType: OperationType;
  time: string;
}

// Интерфейс для рабочей сессии (от DP Setup до DP OFF)
interface DPSession {
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  location: string;
  duration: number; // in minutes
}

// Define colors for different operation types
const operationColors: Record<OperationType, string> = {
  'DP Setup': '#4caf50',      // green
  'Moving in': '#2196f3',     // blue
  'Handling Offshore': '#ff9800', // orange
  'Pulling Out': '#9c27b0',   // purple 
  'DP OFF': '#f44336'         // red
};

// Функция для форматирования даты из yyyy-mm-dd в dd.mm.yyyy
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

// Функция для преобразования пользовательского ввода dd.mm.yyyy в yyyy-mm-dd
const parseUserDateInput = (value: string): string => {
  // Проверяем, соответствует ли ввод формату dd.mm.yyyy (приоритетный формат)
  const ddmmyyyyDotRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  // Проверяем, соответствует ли ввод формату dd/mm/yyyy (для обратной совместимости)
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  // Сначала проверяем формат с точками
  let match = value.match(ddmmyyyyDotRegex);
  if (match) {
    const [_, day, month, year] = match;
    // Преобразуем в формат yyyy-mm-dd
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Затем проверяем формат со слешами для обратной совместимости
  match = value.match(ddmmyyyyRegex);
  if (match) {
    const [_, day, month, year] = match;
    // Преобразуем в формат yyyy-mm-dd
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Если не соответствует никакому формату, возвращаем как есть
  return value;
};

const DPHoursPage = () => {
  const [data, setData] = useState<DPHours[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // current date by default
  );
  const [tabValue, setTabValue] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    start: string, 
    end: string, 
    startTime: string, 
    endTime: string,
    useTimeFilter: boolean
  }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '23:59',
    useTimeFilter: false
  });
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [dpSessions, setDpSessions] = useState<DPSession[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<DPHours>>({
    date: selectedDate,
    time: '',
    location: '',
    operationType: 'DP Setup'
  });
  
  // Fetch data from API when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
  // Function to fetch all records from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await dphoursApi.getAllRecords();
      // Transform API data to match our component's data structure
      const transformedRecords = records.map(record => ({
        id: record._id || record.id || Date.now().toString(),
        date: record.date,
        time: record.time,
        location: record.location,
        operationType: record.operationType
      }));
      
      setData(transformedRecords);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle changes in the new event form
  const handleNewEventChange = (field: keyof DPHours, value: string) => {
    // Если это поле даты и пользователь ввел в формате dd/mm/yyyy
    if (field === 'date') {
      value = parseUserDateInput(value);
    }
    
    setNewEvent({
      ...newEvent,
      [field]: value
    });
  };
  
  // Add new event
  const handleAddEvent = async () => {
    if (!newEvent.date || !newEvent.time || !newEvent.location || !newEvent.operationType) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const savedRecord = await dphoursApi.createRecord({
        date: newEvent.date!,
        time: newEvent.time!,
        location: newEvent.location!,
        operationType: newEvent.operationType as OperationType
      });
      
      const newId = savedRecord._id || Date.now().toString();
      const fullEvent: DPHours = {
        id: newId,
        date: savedRecord.date,
        time: savedRecord.time,
        location: savedRecord.location,
        operationType: savedRecord.operationType
      };
      
      setData([...data, fullEvent]);
      setIsAddDialogOpen(false);
      showSnackbar('Event added successfully', 'success');
      
      // Reset form but keep the current date
      setNewEvent({
        date: selectedDate,
        time: '',
        location: '',
        operationType: 'DP Setup'
      });
    } catch (err) {
      console.error('Failed to add event:', err);
      showSnackbar('Failed to add event', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Switch between tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Edit record function
  const handleEdit = async (id: string, updatedData: DPHours) => {
    setLoading(true);
    try {
      await dphoursApi.updateRecord(id, {
        date: updatedData.date,
        time: updatedData.time,
        location: updatedData.location,
        operationType: updatedData.operationType
      });
      
    setData(data.map((item) => (item.id === id ? updatedData : item)));
      showSnackbar('Record updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update record:', err);
      showSnackbar('Failed to update record', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete record function
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setLoading(true);
    try {
      await dphoursApi.deleteRecord(id);
    setData(data.filter((item) => item.id !== id));
      showSnackbar('Record deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete record:', err);
      showSnackbar('Failed to delete record', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // List of events for the selected date, sorted by time
  const eventsForSelectedDate = useMemo(() => {
    return data
      .filter(event => event.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [data, selectedDate]);
  
  // Get all dates with events
  const datesWithEvents = useMemo(() => {
    const uniqueDates = [...new Set(data.map(item => item.date))];
    return uniqueDates.sort();
  }, [data]);
  
  // Get events for a specific date in All Records view
  const getEventsForDate = (date: string) => {
    return data
      .filter(event => event.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  };
  
  // Toggle date expansion in All Records view
  const toggleDateExpansion = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
    }
  };
  
  // Функция расчета времени между DP Setup и DP OFF
  const calculateDPSessions = (
    startDate: string, 
    endDate: string, 
    useTimeFilter: boolean = false,
    startTime: string = '00:00', 
    endTime: string = '23:59',
    filteredData: DPHours[] = data
  ) => {
    // Отфильтруем события по указанному диапазону дат
    const filteredEvents = filteredData.filter(event => {
      // Фильтр по диапазону дат
      const dateInRange = event.date >= startDate && event.date <= endDate;
      
      // Если не используем фильтр по времени, возвращаем только результат проверки даты
      if (!useTimeFilter) return dateInRange;
      
      // Проверяем диапазон времени для смены
      // Если начало смены меньше конца смены (например, 08:00-20:00) - обычная смена в течение одного дня
      if (startTime <= endTime) {
        return dateInRange && event.time >= startTime && event.time <= endTime;
      } 
      // Если начало смены больше конца смены (например, 20:00-08:00) - ночная смена, пересекающая полночь
      else {
        // Для времени с 00:00 до конца смены следующего дня
        if (event.time <= endTime) {
          // Первый день смены необходимо исключить для этого диапазона времени
          return dateInRange && event.date > startDate;
        }
        // Для времени с начала смены до 23:59
        else if (event.time >= startTime) {
          // Последний день смены необходимо исключить для этого диапазона времени
          return dateInRange && event.date < endDate;
        }
        return false;
      }
    });
    
    // Сортируем события по дате и времени
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });

    interface SessionTemp {
      startDate: string;
      startTime: string;
      location: string;
    }
    
    const sessions: DPSession[] = [];
    let currentSession: SessionTemp | null = null;
    
    for (const event of sortedEvents) {
      if (event.operationType === 'DP Setup') {
        // Если начинается новая сессия DP Setup
        if (currentSession) {
          // Если предыдущая сессия не завершилась, рассчитываем время до конца смены
          let durationMinutes = 0;
          
          if (useTimeFilter) {
            // Рассчитываем время до конца смены
            const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
            
            // Создаем дату-время окончания смены в тот же день
            let sessionEndDateTime: Date;
            
            // Если начало смены меньше конца смены - смена заканчивается в тот же день
            if (startTime <= endTime) {
              sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
            } else {
              // Ночная смена - заканчивается на следующий день
              const nextDay = new Date(currentSession.startDate);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayStr = nextDay.toISOString().split('T')[0];
              sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
            }
            
            // Рассчитываем длительность
            durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
            
            // Если получается отрицательное время, значит смена уже закончилась
            if (durationMinutes < 0) {
              durationMinutes = 0;
            }
          }
          
          sessions.push({
            startDate: currentSession.startDate,
            startTime: currentSession.startTime,
            endDate: null,
            endTime: null,
            location: currentSession.location,
            duration: durationMinutes
          });
        }
        
        // Начинаем новую сессию
        currentSession = {
          startDate: event.date,
          startTime: event.time,
          location: event.location
        };
      } else if (event.operationType === 'DP OFF' && currentSession) {
        // Завершаем текущую сессию
        const startDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
        const endDateTime = new Date(`${event.date}T${event.time}`);
        const durationMs = endDateTime.getTime() - startDateTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        
        sessions.push({
          startDate: currentSession.startDate,
          startTime: currentSession.startTime,
          endDate: event.date,
          endTime: event.time,
          location: currentSession.location,
          duration: durationMinutes
        });
        
        currentSession = null;
      }
    }
    
    // Если есть незавершенная сессия, добавляем её
    if (currentSession) {
      // Рассчитываем время до конца смены
      let durationMinutes = 0;
      
      if (useTimeFilter) {
        // Рассчитываем время до конца смены
        const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
        
        // Создаем дату-время окончания смены в тот же день
        let sessionEndDateTime: Date;
        
        // Если начало смены меньше конца смены - смена заканчивается в тот же день
        if (startTime <= endTime) {
          sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
        } else {
          // Ночная смена - заканчивается на следующий день
          const nextDay = new Date(currentSession.startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
        }
        
        // Рассчитываем длительность
        durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
        
        // Если получается отрицательное время, значит смена уже закончилась
        if (durationMinutes < 0) {
          durationMinutes = 0;
        }
      }
      
      sessions.push({
        startDate: currentSession.startDate,
        startTime: currentSession.startTime,
        endDate: null,
        endTime: null,
        location: currentSession.location,
        duration: durationMinutes
      });
    }
    
    return sessions;
  };
  
  // Функция для форматирования длительности в часах и минутах
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "In progress";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Подсчет общего времени
  const calculateTotalDuration = (sessions: DPSession[]) => {
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    return formatDuration(totalMinutes);
  };
  
  // Обработчик для открытия диалога статистики
  const handleOpenStats = async () => {
    setLoading(true);
    try {
      let records;
      // Get records from API based on date range
      records = await dphoursApi.getRecordsByDateRange(dateRange.start, dateRange.end);
      
      // Transform API data to match our component's data structure
      const transformedRecords = records.map(record => ({
        id: record._id || record.id || Date.now().toString(),
        date: record.date,
        time: record.time,
        location: record.location,
        operationType: record.operationType
      }));
      
      // Calculate sessions using the transformed data
      const sessions = calculateDPSessions(
        dateRange.start, 
        dateRange.end, 
        dateRange.useTimeFilter,
        dateRange.startTime,
        dateRange.endTime,
        transformedRecords
      );
      
      setDpSessions(sessions);
      setIsStatsDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch stats data:', err);
      showSnackbar('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        DP Hours
      </Typography>
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs for switching between modes */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab icon={<TodayIcon />} label="Today" />
          <Tab icon={<TimelineIcon />} label="History" />
        </Tabs>
      </Paper>
      
      {/* Content for "Today" tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Events for Today ({formatDate(new Date().toISOString().split('T')[0])})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => {
                setNewEvent({
                  ...newEvent,
                  date: new Date().toISOString().split('T')[0]
                });
                setIsAddDialogOpen(true);
              }}
            >
              Add Event
            </Button>
          </Box>
          
          {eventsForSelectedDate.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No events for today
            </Typography>
          ) : (
            <Timeline events={eventsForSelectedDate} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </Paper>
      )}
      
      {/* Content for "History" tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              History
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={handleOpenStats}
              >
                DP Statistics
              </Button>
            </Box>
          </Box>
          
          {/* Dates with expandable sections */}
          {datesWithEvents.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              {datesWithEvents.map(date => (
                <Paper 
                  key={date} 
                  sx={{ 
                    mb: 1,
                    overflow: 'hidden',
                    boxShadow: expandedDate === date ? 3 : 1
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      bgcolor: expandedDate === date ? 'primary.light' : 'inherit',
                      color: expandedDate === date ? 'white' : 'inherit',
                      transition: 'background-color 0.3s'
                    }}
                    onClick={() => toggleDateExpansion(date)}
                  >
                    <Typography variant="h6">{formatDate(date)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={`${getEventsForDate(date).length} events`} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      {expandedDate === date ? 
                        <KeyboardArrowUpIcon /> : 
                        <KeyboardArrowDownIcon />
                      }
                    </Box>
                  </Box>
                  
                  <Collapse in={expandedDate === date}>
                    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Timeline 
                        events={getEventsForDate(date)} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No records found
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Dialog for adding new event */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                value={newEvent.date || ''}
                onChange={(e) => handleNewEventChange('date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Time"
                type="time"
                value={newEvent.time || ''}
                onChange={(e) => handleNewEventChange('time', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                value={newEvent.location || ''}
                onChange={(e) => handleNewEventChange('location', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Operation Type</InputLabel>
                <Select
                  value={newEvent.operationType || ''}
                  onChange={(e) => handleNewEventChange('operationType', e.target.value)}
                  label="Operation Type"
                >
                  {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddEvent} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for DP Statistics */}
      <Dialog open={isStatsDialogOpen} onClose={() => setIsStatsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>DP Time Statistics</DialogTitle>
        <DialogContent>
          {/* Date Range Selection */}
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  const value = parseUserDateInput(e.target.value);
                  setDateRange({...dateRange, start: value});
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  const value = parseUserDateInput(e.target.value);
                  setDateRange({...dateRange, end: value});
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                onClick={() => {
                  const sessions = calculateDPSessions(
                    dateRange.start, 
                    dateRange.end,
                    dateRange.useTimeFilter,
                    dateRange.startTime,
                    dateRange.endTime
                  );
                  setDpSessions(sessions);
                }}
                fullWidth
                sx={{ height: '56px' }}
              >
                Update
              </Button>
            </Grid>
          </Grid>
          
          {/* Shift Filter Controls */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                label={dateRange.useTimeFilter ? "Shift Filter: ON" : "Shift Filter: OFF"}
                color={dateRange.useTimeFilter ? "primary" : "default"}
                onClick={() => setDateRange({
                  ...dateRange, 
                  useTimeFilter: !dateRange.useTimeFilter
                })}
                sx={{ cursor: 'pointer', mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {dateRange.useTimeFilter 
                  ? "Filtering events by shift time" 
                  : "Click to enable shift time filtering"}
              </Typography>
            </Box>
            
            {dateRange.useTimeFilter && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Shift Start Time:</Typography>
                      <TextField
                        type="time"
                        value={dateRange.startTime}
                        onChange={(e) => setDateRange({...dateRange, startTime: e.target.value})}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Shift End Time:</Typography>
                      <TextField
                        type="time"
                        value={dateRange.endTime}
                        onChange={(e) => setDateRange({...dateRange, endTime: e.target.value})}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Total Working Time: {calculateTotalDuration(dpSessions)}
            {dateRange.useTimeFilter && (
              <Chip 
                label={`Shift: ${dateRange.startTime} - ${dateRange.endTime}`}
                size="small"
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          {dpSessions.length > 0 ? (
            <List>
              {dpSessions.map((session, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Start:</Typography>
                        <Typography variant="body1">
                          {formatDate(session.startDate)} {session.startTime}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">End:</Typography>
                        <Typography variant="body1">
                          {session.endDate 
                            ? `${formatDate(session.endDate)} ${session.endTime}` 
                            : (session.duration > 0 
                              ? `End of shift (estimate)` 
                              : "Not completed")
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Location:</Typography>
                        <Typography variant="body1">{session.location}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {session.endDate 
                            ? formatDuration(session.duration) 
                            : (session.duration > 0 
                              ? `${formatDuration(session.duration)} (est.)` 
                              : "In progress")
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No data for selected period
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Component for displaying event timeline
interface TimelineProps {
  events: DPHours[];
  onEdit: (id: string, data: DPHours) => void;
  onDelete: (id: string) => void;
}

const Timeline = ({ events, onEdit, onDelete }: TimelineProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DPHours | null>(null);
  
  const handleEditClick = (event: DPHours) => {
    setEditingId(event.id);
    setEditForm({...event});
  };
  
  const handleEditChange = (field: keyof DPHours, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };
  
  const handleSaveEdit = () => {
    if (editForm) {
      onEdit(editForm.id, editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };
  
  return (
    <List sx={{ width: '100%' }}>
      {events.map((event, index) => (
        <React.Fragment key={event.id}>
          {index > 0 && <Divider component="li" />}
          <ListItem 
            sx={{ 
              py: 2,
              borderLeft: `4px solid ${operationColors[event.operationType]}`,
              pl: 3
            }}
          >
            {editingId === event.id ? (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Time"
                    type="time"
                    value={editForm?.time || ''}
                    onChange={(e) => handleEditChange('time', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Operation Type</InputLabel>
                    <Select
                      value={editForm?.operationType || ''}
                      onChange={(e) => handleEditChange('operationType', e.target.value)}
                      label="Operation Type"
                    >
                      {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Location"
                    value={editForm?.location || ''}
                    onChange={(e) => handleEditChange('location', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span" fontWeight="bold" sx={{ mr: 2 }}>
                        {event.time}
                      </Typography>
                      <Chip 
                        label={event.operationType}
                        size="small"
                        sx={{ 
                          backgroundColor: operationColors[event.operationType],
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                  secondary={`Location: ${event.location}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleEditClick(event)} size="small" sx={{ mr: 1 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" onClick={() => onDelete(event.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </>
            )}
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};

export default DPHoursPage; 