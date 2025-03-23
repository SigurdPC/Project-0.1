import React, { useState, useMemo, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, Tabs, Tab, List, ListItem, ListItemText, 
  ListItemSecondaryAction, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, 
  MenuItem, Divider, Grid,
  Collapse, FormControlLabel, Snackbar, Alert, CircularProgress,
  TablePagination, InputAdornment, Pagination
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Today as TodayIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import dphoursApi, { DPHours as APIDPHours } from '../api/dphoursApi';
import { formatDate, parseUserDateInput } from '../utils/dateUtils';

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

// Определение типа TimelineProps
interface TimelineProps {
  events: DPHours[];
  onEdit: (id: string, updatedData: DPHours) => void;
  onDelete?: (id: string) => void;
}

// Компонент Timeline для отображения событий 
const Timeline = ({ events, onEdit, onDelete }: TimelineProps) => {
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  
  // Группировка событий по локациям
  const eventsByLocation = useMemo(() => {
    const grouped: Record<string, DPHours[]> = {};
    
    events.forEach((event: DPHours) => {
      if (!grouped[event.location]) {
        grouped[event.location] = [];
      }
      grouped[event.location].push(event);
    });
    
    // Сортировка событий внутри каждой локации по времени
    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return grouped;
  }, [events]);
  
  const handleEditLocationClick = (location: string, locationEvents: DPHours[]) => {
    // Вызываем обработчик редактирования локации
    if (typeof onEdit === 'function') {
      onEdit(locationEvents[0].id, {
        ...locationEvents[0],
        location: location
      });
    }
  };
  
  const handleDeleteLocationClick = (locationEvents: DPHours[]) => {
    // Проверяем, что onDelete существует и запрашиваем подтверждение
    if (typeof onDelete === 'function' && window.confirm(`Вы уверены, что хотите удалить все операции для локации "${locationEvents[0].location}"?`)) {
      // Удаляем первую запись (обработчик сам обновит UI)
      onDelete(locationEvents[0].id);
    }
  };
  
  // Если нет событий, возвращаем пустой компонент
  if (Object.keys(eventsByLocation).length === 0) {
    return null;
  }
  
  return (
    <Box>
      {Object.entries(eventsByLocation).map(([location, locationEvents], locationIndex) => (
        <Paper key={location} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Location: {location}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                {locationEvents.length} operations
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleEditLocationClick(location, locationEvents)}
                sx={{ color: 'white', mr: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteLocationClick(locationEvents)}
                sx={{ color: 'white' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <List sx={{ width: '100%' }}>
            {locationEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  sx={{ 
                    py: 2,
                    borderLeft: `4px solid ${operationColors[event.operationType]}`,
                    pl: 3
                  }}
                >
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
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
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
  
  // Новый стейт для комплексного добавления событий
  const [complexAdd, setComplexAdd] = useState<{
    open: boolean;
    date: string;
    location: string;
    operations: {id: string; time: string; operationType: OperationType}[];
  }>({
    open: false,
    date: new Date().toISOString().split('T')[0],
    location: '',
    operations: []
  });
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  
  // Пагинация для истории событий
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  
  // История: открытие диалога редактирования локации
  const [isLocationEditDialogOpen, setIsLocationEditDialogOpen] = useState<boolean>(false);
  const [locationEditData, setLocationEditData] = useState<{
    date: string;
    oldLocation: string;
    newLocation: string;
    events: DPHours[];
  } | null>(null);
  
  // Добавляем диалог редактирования отдельной записи
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<DPHours | null>(null);
  
  // Fetch data from the API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await dphoursApi.getAllRecords();
      
      // Transform API data to match our component's data structure
      const transformedData = response.map(record => ({
        id: record._id || record.id || Date.now().toString(),
        date: record.date,
        time: record.time,
        location: record.location,
        operationType: record.operationType
      }));
      
      // Sort by date (descending) and time (ascending)
      transformedData.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime(); // Descending by date
        }
        return a.time.localeCompare(b.time); // Ascending by time
      });
      
      setData(transformedData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data from API when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
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

  // Обработчик поиска
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // При изменении поиска сбрасываем на первую страницу
    setHistoryPage(1);
  };
  
  // Обработчики пагинации
  const handleHistoryPageChange = (event: unknown, newPage: number) => {
    setHistoryPage(newPage + 1);
  };

  const handleHistoryRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(1);
  };
  
  // Сгруппированные события по локациям для конкретной даты
  const getGroupedEventsForDate = (date: string) => {
    const events = getEventsForDate(date);
    const grouped: Record<string, DPHours[]> = {};
    
    events.forEach(event => {
      if (!grouped[event.location]) {
        grouped[event.location] = [];
      }
      grouped[event.location].push(event);
    });
    
    // Сортировка событий внутри каждой локации по времени
    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return grouped;
  };
  
  // Отфильтрованные события для конкретной даты
  const getFilteredEventsForDate = (date: string) => {
    if (!searchQuery.trim()) {
      return getEventsForDate(date);
    }
    
    const query = searchQuery.toLowerCase();
    const events = getEventsForDate(date);
    
    return events.filter(event => 
      event.time.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.operationType.toLowerCase().includes(query) ||
      formatDate(event.date).toLowerCase().includes(query)
    );
  };
  
  // Отфильтрованные локации для конкретной даты
  const getFilteredLocationsForDate = (date: string) => {
    if (!searchQuery.trim()) {
      return Object.keys(getGroupedEventsForDate(date));
    }
    
    const query = searchQuery.toLowerCase();
    const groupedEvents = getGroupedEventsForDate(date);
    
    const filteredLocations: string[] = [];
    
    Object.entries(groupedEvents).forEach(([location, events]) => {
      // Проверяем, содержит ли локация искомую строку
      if (location.toLowerCase().includes(query)) {
        filteredLocations.push(location);
        return;
      }
      
      // Проверяем, содержит ли хотя бы одно событие искомую строку
      const hasMatchingEvent = events.some(event => 
        event.time.toLowerCase().includes(query) ||
        event.operationType.toLowerCase().includes(query) ||
        formatDate(event.date).toLowerCase().includes(query)
      );
      
      if (hasMatchingEvent) {
        filteredLocations.push(location);
      }
    });
    
    return filteredLocations;
  };
  
  // Получение отфильтрованных событий для локации
  const getFilteredEventsForLocation = (date: string, location: string) => {
    if (!searchQuery.trim()) {
      return getGroupedEventsForDate(date)[location] || [];
    }
    
    const query = searchQuery.toLowerCase();
    const events = getGroupedEventsForDate(date)[location] || [];
    
    return events.filter(event => 
      event.time.toLowerCase().includes(query) ||
      event.operationType.toLowerCase().includes(query) ||
      formatDate(event.date).toLowerCase().includes(query)
    );
  };
  
  // Отфильтрованные даты с событиями на основе поискового запроса
  const filteredDatesWithEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return datesWithEvents;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Оставляем только те даты, у которых есть события, соответствующие поисковому запросу
    return datesWithEvents.filter(date => {
      const events = getEventsForDate(date);
      return events.some(event => 
        event.time.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.operationType.toLowerCase().includes(query) ||
        formatDate(event.date).toLowerCase().includes(query)
      );
    });
  }, [datesWithEvents, searchQuery, data]);
  
  // Пагинированные даты с событиями
  const paginatedDatesWithEvents = useMemo(() => {
    const startIndex = (historyPage - 1) * historyRowsPerPage;
    return filteredDatesWithEvents.slice(startIndex, startIndex + historyRowsPerPage);
  }, [filteredDatesWithEvents, historyPage, historyRowsPerPage]);
  
  // Открытие диалога комплексного добавления
  const handleOpenComplexAdd = () => {
    setComplexAdd({
      open: true,
      date: new Date().toISOString().split('T')[0],
      location: '',
      operations: [{
        id: Date.now().toString(),
        time: '',
        operationType: 'DP Setup'
      }]
    });
  };
  
  // Закрытие диалога комплексного добавления
  const handleCloseComplexAdd = () => {
    setComplexAdd({
      ...complexAdd,
      open: false
    });
  };
  
  // Изменение даты или локации в комплексном добавлении
  const handleComplexAddBaseChange = (field: 'date' | 'location', value: string) => {
    if (field === 'date') {
      value = parseUserDateInput(value);
    }
    
    setComplexAdd({
      ...complexAdd,
      [field]: value
    });
  };
  
  // Добавление новой операции в комплексном добавлении
  const handleAddOperation = () => {
    setComplexAdd({
      ...complexAdd,
      operations: [
        ...complexAdd.operations,
        {
          id: Date.now().toString(),
          time: '',
          operationType: 'DP Setup'
        }
      ]
    });
  };
  
  // Изменение операции в комплексном добавлении
  const handleOperationChange = (id: string, field: 'time' | 'operationType', value: string) => {
    setComplexAdd({
      ...complexAdd,
      operations: complexAdd.operations.map(op => 
        op.id === id ? { ...op, [field]: value } : op
      )
    });
  };
  
  // Удаление операции в комплексном добавлении
  const handleRemoveOperation = (id: string) => {
    // Не удаляем, если осталась только одна операция
    if (complexAdd.operations.length <= 1) return;
    
    setComplexAdd({
      ...complexAdd,
      operations: complexAdd.operations.filter(op => op.id !== id)
    });
  };
  
  // Сохранение всех операций из комплексного добавления
  const handleSaveComplexAdd = async () => {
    // Проверка заполнения всех полей
    if (!complexAdd.date || !complexAdd.location) {
      showSnackbar('Пожалуйста, введите дату и локацию', 'warning');
      return;
    }
    
    // Проверка, что все операции имеют время
    if (complexAdd.operations.some(op => !op.time)) {
      showSnackbar('Пожалуйста, введите время для всех операций', 'warning');
      return;
    }
    
    // Сортировка операций по времени
    const sortedOperations = [...complexAdd.operations].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    
    setLoading(true);
    
    try {
      const newEvents: DPHours[] = [];
      
      // Создаем и сохраняем каждую операцию
      for (const op of sortedOperations) {
        const savedRecord = await dphoursApi.createRecord({
          date: complexAdd.date,
          time: op.time,
          location: complexAdd.location,
          operationType: op.operationType
        });
        
        const newId = savedRecord._id || Date.now().toString();
        const fullEvent: DPHours = {
          id: newId,
          date: savedRecord.date,
          time: savedRecord.time,
          location: savedRecord.location,
          operationType: savedRecord.operationType
        };
        
        newEvents.push(fullEvent);
      }
      
      // Обновляем данные и закрываем диалог
      setData([...data, ...newEvents]);
      setComplexAdd({
        ...complexAdd,
        open: false
      });
      
      showSnackbar(`Добавлено ${newEvents.length} событий`, 'success');
    } catch (err) {
      console.error('Failed to add events:', err);
      showSnackbar('Не удалось добавить события', 'error');
    } finally {
      setLoading(false);
    }
  };

  // История: обработчик редактирования локации
  const handleEditLocation = (date: string, location: string, events: DPHours[]) => {
    setIsLocationEditDialogOpen(true);
    setLocationEditData({
      date,
      oldLocation: location,
      newLocation: location,
      events
    });
  };
  
  // История: отмена редактирования локации
  const handleCancelLocationEdit = () => {
    setIsLocationEditDialogOpen(false);
    setLocationEditData(null);
  };
  
  // История: изменение названия локации
  const handleLocationNameChange = (value: string) => {
    if (locationEditData) {
      setLocationEditData({
        ...locationEditData,
        newLocation: value
      });
    }
  };

  // История: изменение даты для всех операций
  const handleLocationDateChange = (value: string) => {
    if (locationEditData) {
      // Конвертируем дату в правильный формат
      const formattedDate = parseUserDateInput(value);
      
      // Создаем копию событий с обновленной датой
      const updatedEvents = locationEditData.events.map(event => ({
        ...event,
        date: formattedDate
      }));
      
      setLocationEditData({
        ...locationEditData,
        date: formattedDate,
        events: updatedEvents
      });
    }
  };

  // История: изменение данных операции в диалоге редактирования локации
  const handleLocationOperationChange = (index: number, field: keyof DPHours, value: any) => {
    if (locationEditData) {
      const updatedEvents = [...locationEditData.events];
      updatedEvents[index] = {
        ...updatedEvents[index],
        [field]: value
      };
      setLocationEditData({
        ...locationEditData,
        events: updatedEvents
      });
    }
  };

  // История: удаление всех операций локации
  const handleDeleteLocationEvents = async () => {
    if (!locationEditData || !window.confirm(`Вы уверены, что хотите удалить все операции для локации "${locationEditData.newLocation}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      // Удаляем каждое событие
      for (const event of locationEditData.events) {
        await dphoursApi.deleteRecord(event.id);
      }
      
      // Обновляем данные на клиенте
      setData(prev => prev.filter(item => 
        !locationEditData.events.some(e => e.id === item.id)
      ));
      
      setIsLocationEditDialogOpen(false);
      setLocationEditData(null);
      showSnackbar('Локация успешно удалена', 'success');
    } catch (error) {
      console.error('Failed to delete location:', error);
      showSnackbar('Не удалось удалить локацию', 'error');
    } finally {
      setLoading(false);
    }
  };

  // История: сохранение изменений локации
  const handleSaveLocationEdit = async () => {
    if (!locationEditData) return;
    
    setLoading(true);
    try {
      // Обновляем каждое событие с возможно измененными данными операций
      for (const event of locationEditData.events) {
        await dphoursApi.updateRecord(event.id, {
          ...event,
          date: locationEditData.date,
          location: locationEditData.newLocation
        });
      }
      
      // Обновляем данные на клиенте
      setData(prev => prev.map(item => {
        // Находим соответствующее обновленное событие
        const updatedEvent = locationEditData.events.find(e => e.id === item.id);
        if (updatedEvent) {
          return { 
            ...item, 
            date: locationEditData.date,
            location: locationEditData.newLocation,
            time: updatedEvent.time,
            operationType: updatedEvent.operationType 
          };
        }
        return item;
      }));
      
      setIsLocationEditDialogOpen(false);
      setLocationEditData(null);
      showSnackbar('Записи успешно обновлены', 'success');
    } catch (error) {
      console.error('Failed to update location:', error);
      showSnackbar('Не удалось обновить записи', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Основной компонент: обработчик редактирования записи
  const handleEditOperation = (operation: DPHours) => {
    // Инициализируем данные для редактирования
    setEditFormData({
      id: operation.id,
      date: operation.date,
      location: operation.location,
      time: operation.time,
      operationType: operation.operationType
    });
    
    // Открываем диалог редактирования
    setIsEditDialogOpen(true);
  };

  // Функция получения локаций для конкретной даты
  const getLocationsForDate = (date: string): string[] => {
    // Фильтруем записи по дате и получаем уникальные локации
    const locations = data
      .filter(item => item.date === date)
      .map(item => item.location)
      .filter((value, index, self) => self.indexOf(value) === index); // получаем уникальные значения
    
    return locations;
  };

  // Функция для отображения истории по дате с добавлением кнопок редактирования
  const renderHistoryByDate = (date: string) => {
    const locationsForDate = getLocationsForDate(date);
    
    return (
      <Box>
        {locationsForDate.map((location: string) => (
          <Paper key={`${date}-${location}`} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'primary.light', 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {location}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {getFilteredEventsForLocation(date, location).length} operations
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleEditLocation(date, location, getFilteredEventsForLocation(date, location))}
                  sx={{ color: 'white', ml: 1, mr: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => {
                    if (window.confirm(`Вы уверены, что хотите удалить все операции для локации "${location}"?`)) {
                      const events = getFilteredEventsForLocation(date, location);
                      if (events.length > 0) {
                        handleDeleteOperation(events[0].id);
                      }
                    }
                  }}
                  sx={{ color: 'white' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <List sx={{ width: '100%' }}>
              {getFilteredEventsForLocation(date, location).map((event, index) => (
                <React.Fragment key={event.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    sx={{ 
                      py: 1.5,
                      borderLeft: `4px solid ${operationColors[event.operationType]}`,
                      pl: 3
                    }}
                  >
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
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ))}
      </Box>
    );
  };

  // Обработчик сохранения изменений отдельной записи
  const handleSaveEdit = async () => {
    if (!editFormData?.id) return;
    
    setLoading(true);
    try {
      // Обновляем запись
      await dphoursApi.updateRecord(editFormData.id, {
        ...editFormData
      });
      
      // Обновляем данные на клиенте
      setData(prev => prev.map(item => 
        item.id === editFormData.id ? editFormData : item
      ));
      
      setIsEditDialogOpen(false);
      setEditFormData(null);
      showSnackbar('Operation updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update operation:', error);
      showSnackbar('Failed to update operation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления отдельной записи
  const handleDeleteOperation = async (id: string) => {
    setLoading(true);
    try {
      // Удаляем запись
      await dphoursApi.deleteRecord(id);
      
      // Обновляем данные на клиенте
      setData(prev => prev.filter(item => item.id !== id));
      
      showSnackbar('Operation deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete operation:', error);
      showSnackbar('Failed to delete operation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // В диалоге редактирования локации добавим возможность удаления отдельной операции
  const handleDeleteSingleOperation = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Удаляем запись
      await dphoursApi.deleteRecord(id);
      
      // Обновляем данные на клиенте
      setData(prev => prev.filter(item => item.id !== id));
      
      // Если это последняя операция в локации, закрываем диалог
      if (locationEditData && locationEditData.events.length <= 1) {
        setIsLocationEditDialogOpen(false);
        setLocationEditData(null);
        showSnackbar('Операция успешно удалена', 'success');
      } else if (locationEditData) {
        // Иначе обновляем список операций в локации
        setLocationEditData({
          ...locationEditData,
          events: locationEditData.events.filter(event => event.id !== id)
        });
        showSnackbar('Операция успешно удалена', 'success');
      }
    } catch (error) {
      console.error('Failed to delete operation:', error);
      showSnackbar('Не удалось удалить операцию', 'error');
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
              onClick={handleOpenComplexAdd}
            >
              Add Event
            </Button>
          </Box>
          
          {eventsForSelectedDate.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No events for today
            </Typography>
          ) : (
            <Box>
              {Object.entries(getGroupedEventsForDate(selectedDate)).map(([location, locationEvents], locationIndex) => (
                <Paper key={location} sx={{ mb: 3, overflow: 'hidden' }}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Location: {location}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ mr: 1 }}>
                        {locationEvents.length} operations
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditLocation(selectedDate, location, locationEvents)}
                        sx={{ color: 'white', mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          if (window.confirm(`Вы уверены, что хотите удалить все операции для локации "${location}"?`)) {
                            if (locationEvents.length > 0) {
                              handleDeleteOperation(locationEvents[0].id);
                            }
                          }
                        }}
                        sx={{ color: 'white' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <List sx={{ width: '100%' }}>
                    {locationEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        {index > 0 && <Divider component="li" />}
                        <ListItem 
                          sx={{ 
                            py: 2,
                            borderLeft: `4px solid ${operationColors[event.operationType]}`,
                            pl: 3
                          }}
                        >
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
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              ))}
            </Box>
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
              <TextField
                placeholder="Поиск..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                sx={{ width: '250px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                variant="outlined"
                onClick={handleOpenStats}
              >
                DP Statistics
              </Button>
            </Box>
          </Box>
          
          {/* Dates with expandable sections */}
          {paginatedDatesWithEvents.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              {paginatedDatesWithEvents.map(date => (
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
                        label={`${getFilteredEventsForDate(date).length} events in ${getFilteredLocationsForDate(date).length} locations`}
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
                      {getFilteredLocationsForDate(date).length === 0 ? (
                        <Typography align="center" color="text.secondary" sx={{ py: 2 }}>
                          {searchQuery ? 'Нет результатов по вашему запросу' : 'Нет данных для этой даты'}
                        </Typography>
                      ) : (
                        renderHistoryByDate(date)
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {searchQuery ? 'Нет результатов по вашему запросу' : 'No records found'}
            </Typography>
          )}
          
          {/* Пагинация для истории */}
          {filteredDatesWithEvents.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredDatesWithEvents.length}
                page={historyPage - 1}
                onPageChange={handleHistoryPageChange}
                rowsPerPage={historyRowsPerPage}
                onRowsPerPageChange={handleHistoryRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="на странице:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
              />
            </Box>
          )}
        </Paper>
      )}
      
      {/* Dialog for complex adding multiple operations */}
      <Dialog 
        open={complexAdd.open} 
        onClose={handleCloseComplexAdd} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Add Operations</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                value={complexAdd.date || ''}
                onChange={(e) => handleComplexAddBaseChange('date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                value={complexAdd.location || ''}
                onChange={(e) => handleComplexAddBaseChange('location', e.target.value)}
                fullWidth
                placeholder="Enter location"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" gutterBottom>
            Operations
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            {complexAdd.operations.map((operation, index) => (
              <Grid 
                container 
                spacing={2} 
                key={operation.id}
                sx={{ 
                  mb: 2,
                  pb: index < complexAdd.operations.length - 1 ? 2 : 0,
                  borderBottom: index < complexAdd.operations.length - 1 ? '1px dashed #ccc' : 'none'
                }}
              >
                <Grid item xs={12} sm={4}>
              <TextField
                    label="Time"
                    type="time"
                    value={operation.time || ''}
                    onChange={(e) => handleOperationChange(operation.id, 'time', e.target.value)}
                fullWidth
                    InputLabelProps={{ shrink: true }}
              />
            </Grid>
                <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operation Type</InputLabel>
                <Select
                      value={operation.operationType || ''}
                      onChange={(e) => handleOperationChange(operation.id, 'operationType', e.target.value)}
                  label="Operation Type"
                >
                  {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
                <Grid item xs={12} sm={2}>
                  <IconButton 
                    color="error"
                    onClick={() => handleRemoveOperation(operation.id)}
                    disabled={complexAdd.operations.length <= 1}
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
          </Grid>
              </Grid>
            ))}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                startIcon={<AddIcon />}
                onClick={handleAddOperation}
                variant="outlined"
              >
                Add Operation
              </Button>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total: {complexAdd.operations.length} operations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {complexAdd.date && formatDate(complexAdd.date)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComplexAdd}>Cancel</Button>
          <Button 
            onClick={handleSaveComplexAdd} 
            variant="contained" 
            color="primary" 
            disabled={!complexAdd.date || !complexAdd.location || complexAdd.operations.some(op => !op.time)}
          >
            Save All
          </Button>
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
      
      {/* Dialog for editing location */}
      <Dialog
        open={isLocationEditDialogOpen}
        onClose={handleCancelLocationEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                value={locationEditData?.date || ''}
                onChange={(e) => handleLocationDateChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="New Location"
                value={locationEditData?.newLocation || ''}
                onChange={(e) => handleLocationNameChange(e.target.value)}
                fullWidth
                placeholder="Enter location"
              />
            </Grid>
          </Grid>

          {locationEditData && locationEditData.events.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Operations
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                {locationEditData.events.map((event, index) => (
                  <Grid 
                    container 
                    spacing={2} 
                    key={event.id}
                    sx={{ 
                      mb: 2,
                      pb: 2,
                      borderBottom: index < locationEditData.events.length - 1 ? '1px dashed #ccc' : 'none'
                    }}
                  >
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Time"
                        type="time"
                        value={event.time || ''}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => handleLocationOperationChange(index, 'time', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={7}>
                      <FormControl fullWidth>
                        <InputLabel>Operation Type</InputLabel>
                        <Select
                          value={event.operationType || ''}
                          label="Operation Type"
                          onChange={(e) => handleLocationOperationChange(index, 'operationType', e.target.value as OperationType)}
                        >
                          {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSingleOperation(event.id)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Paper>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total: {locationEditData.events.length} operations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {locationEditData.date && formatDate(locationEditData.date)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLocationEdit}>Cancel</Button>
          <Button 
            onClick={handleSaveLocationEdit} 
            variant="contained" 
            color="primary"
            disabled={!locationEditData?.newLocation || loading}
            sx={{ ml: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for editing operation */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Operation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                value={editFormData?.date || ''}
                onChange={(e) => setEditFormData({ ...editFormData!, date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  placeholder: "дд.мм.гггг"
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Time"
                type="time"
                value={editFormData?.time || ''}
                onChange={(e) => setEditFormData({ ...editFormData!, time: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Location"
                value={editFormData?.location || ''}
                onChange={(e) => setEditFormData({ ...editFormData!, location: e.target.value })}
                fullWidth
                placeholder="Enter location"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Operation Type</InputLabel>
                <Select
                  value={editFormData?.operationType || ''}
                  label="Operation Type"
                  onChange={(e) => setEditFormData({ ...editFormData!, operationType: e.target.value as OperationType })}
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
          <Button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this operation?')) {
                if (editFormData?.id) {
                  handleDeleteOperation(editFormData.id);
                }
                setIsEditDialogOpen(false);
              }
            }} 
            color="error" 
            startIcon={<DeleteForeverIcon />}
            sx={{ position: 'absolute', left: 16 }}
          >
            Delete
          </Button>
          <Box>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained" 
              color="primary"
              disabled={!editFormData?.location || !editFormData?.time || !editFormData?.operationType || loading}
              sx={{ ml: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
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

export default DPHoursPage; 