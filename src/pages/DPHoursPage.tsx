import React, { useState, useMemo, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, Tabs, Tab, List, ListItem, ListItemText, 
  Alert, CircularProgress, TablePagination, InputAdornment,
  Collapse, Snackbar, Chip, Divider, IconButton
} from '@mui/material';
import { 
  Today as TodayIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import dphoursApi from '../api/dphoursApi';
import Timeline from '../components/dphours/Timeline';
import { 
  ComplexAddDialog, 
  StatsDialog, 
  EditLocationDialog, 
  EditOperationDialog 
} from '../components/dphours/Dialogs';
import { 
  DPHours, 
  OperationType, 
  DPSession, 
  SnackbarState, 
  DateRange, 
  ComplexAddState,
  LocationEditData,
  operationColors
} from '../components/dphours/types';
import { 
  formatDate, 
  parseUserDateInput, 
  calculateDPSessions,
  calculateTotalDuration,
  formatDuration
} from '../components/dphours/utils';

const DPHoursPage = () => {
  // Состояние данных
  const [data, setData] = useState<DPHours[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние UI
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // current date by default
  );
  const [tabValue, setTabValue] = useState<number>(0);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  
  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [isLocationEditDialogOpen, setIsLocationEditDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  
  // Данные форм и диалогов
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10), 
    startTime: '00:00',
    endTime: '23:59',
    useTimeFilter: false
  });
  const [dpSessions, setDpSessions] = useState<DPSession[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<DPHours>>({
    date: selectedDate,
    time: '',
    location: '',
    operationType: 'DP Setup'
  });
  const [complexAdd, setComplexAdd] = useState<ComplexAddState>({
    open: false,
    date: new Date().toISOString().split('T')[0],
    location: '',
    operations: []
  });
  const [locationEditData, setLocationEditData] = useState<LocationEditData | null>(null);
  const [editFormData, setEditFormData] = useState<DPHours | null>(null);
  
  // Пагинация для основного списка
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch data from the API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await dphoursApi.getAllRecords();
      
      // Transform API data to match our component's data structure
      const transformedData = response.map(record => ({
        id: record.id || Date.now().toString(),
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
    // Convert date format if user entered in DD/MM/YYYY
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
      
      const newId = savedRecord.id || Date.now().toString();
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
    return uniqueDates.sort().reverse(); // Сортировка по убыванию дат
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
  
  // Обработчик для открытия диалога статистики
  const handleOpenStats = async () => {
    setLoading(true);
    try {
      let records;
      // Get records from API based on date range
      records = await dphoursApi.getRecordsByDateRange(dateRange.start, dateRange.end);
      
      // Transform API data to match our component's data structure
      const transformedRecords = records.map(record => ({
        id: record.id || Date.now().toString(),
        date: record.date,
        time: record.time,
        location: record.location,
        operationType: record.operationType
      }));
      
      // Calculate sessions using the transformed data
      const sessions = calculateDPSessions(
        dateRange.start, 
        dateRange.end, 
        transformedRecords,
        dateRange.useTimeFilter,
        dateRange.startTime,
        dateRange.endTime
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
  
  // Функция получения локаций для конкретной даты
  const getLocationsForDate = (date: string): string[] => {
    // Фильтруем записи по дате и получаем уникальные локации
    const locations = data
      .filter(item => item.date === date)
      .map(item => item.location)
      .filter((value, index, self) => self.indexOf(value) === index); // получаем уникальные значения
    
    return locations;
  };

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
        
        const newId = savedRecord.id || Date.now().toString();
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
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Удаляем запись
      await dphoursApi.deleteRecord(id);
      
      // Обновляем данные на клиенте
      setData(prev => prev.filter(item => item.id !== id));
      
      // Если открыт диалог редактирования, закрываем его
      if (editFormData?.id === id) {
        setIsEditDialogOpen(false);
        setEditFormData(null);
      }
      
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
  
  // Обработчик изменения данных в форме редактирования
  const handleFormChange = (field: keyof DPHours, value: any) => {
    if (editFormData) {
      // Если это поле даты и пользователь ввел в формате dd/mm/yyyy
      if (field === 'date') {
        value = parseUserDateInput(value);
      }
      
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };
  
  // Обработчик даты для статистики
  const handleDateRangeChange = (field: string, value: string) => {
    if (field === 'start' || field === 'end') {
      value = parseUserDateInput(value);
    }
    
    setDateRange({
      ...dateRange,
      [field]: value
    });
  };
  
  // Переключение фильтра по времени
  const handleToggleTimeFilter = () => {
    setDateRange({
      ...dateRange,
      useTimeFilter: !dateRange.useTimeFilter
    });
  };

  // Функция для фильтрации данных
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Фильтр по диапазону дат
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59); // Включаем весь конечный день
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    
    // Фильтр по поисковому запросу
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.location.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    return filtered;
  }, [data, dateRange, searchTerm]);
  
  // Обработчики пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Функция применения фильтра по дате
  const applyDateFilter = () => {
    setPage(0); // Сбрасываем на первую страницу при применении фильтра
    // Устанавливаем общее количество записей для пагинации
    setTotalRecords(filteredData.length);
  };

  // Эффект для установки общего числа записей при загрузке данных
  useEffect(() => {
    if (!loading) {
      setTotalRecords(filteredData.length);
    }
  }, [filteredData, loading]);
  
  // Адаптеры для новых обработчиков Timeline
  const handleEditOperationAdapter = (record: DPHours) => {
    handleEdit(record.id, record);
  };
  
  const handleDeleteOperationAdapter = (id: string) => {
    handleDelete(id);
  };

  // Функция для отображения истории по дате с добавлением кнопок редактирования
  const renderHistoryByDate = (date: string) => {
    const locationsForDate = getFilteredLocationsForDate(date);
    
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
              Events for Today ({formatDate(selectedDate)})
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
            <Timeline 
              events={eventsForSelectedDate} 
              onEdit={handleEdit}
              onEditLocation={handleEditLocation}  
              onDelete={handleDelete}
            />
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
      <ComplexAddDialog
        open={complexAdd.open}
        loading={loading}
        complexAdd={complexAdd}
        onClose={handleCloseComplexAdd}
        onSave={handleSaveComplexAdd}
        onBaseChange={handleComplexAddBaseChange}
        onAddOperation={handleAddOperation}
        onOperationChange={handleOperationChange}
        onRemoveOperation={handleRemoveOperation}
      />
      
      {/* Dialog for DP Statistics */}
      <StatsDialog
        open={isStatsDialogOpen}
        dateRange={dateRange}
        dpSessions={dpSessions}
        onClose={() => setIsStatsDialogOpen(false)}
        onDateRangeChange={handleDateRangeChange}
        onToggleTimeFilter={handleToggleTimeFilter}
        onUpdateStats={handleOpenStats}
      />
      
      {/* Dialog for editing location */}
      <EditLocationDialog
        open={isLocationEditDialogOpen}
        loading={loading}
        locationEditData={locationEditData}
        onClose={handleCancelLocationEdit}
        onSave={handleSaveLocationEdit}
        onLocationDateChange={handleLocationDateChange}
        onLocationNameChange={handleLocationNameChange}
        onLocationOperationChange={handleLocationOperationChange}
        onDeleteSingleOperation={handleDeleteSingleOperation}
        onDeleteAllOperations={handleDeleteLocationEvents}
      />
      
      {/* Dialog for editing operation */}
      <EditOperationDialog
        open={isEditDialogOpen}
        loading={loading}
        editFormData={editFormData}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEdit}
        onFormChange={handleFormChange}
        onDelete={() => editFormData && handleDeleteOperation(editFormData.id)}
      />
      
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