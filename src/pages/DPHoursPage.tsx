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
  EditLocationDialog, 
  EditOperationDialog
} from '../components/dphours/Dialogs';
import { 
  DPHours, 
  OperationType, 
  SnackbarState, 
  ComplexAddState,
  LocationEditData,
  operationColors
} from '../components/dphours/types';
import { 
  formatDate, 
  parseUserDateInput, 
  formatDuration
} from '../components/dphours/utils';

// Импорт компонентов
import TodayView from '../components/dphours/views/TodayView';
import HistoryView from '../components/dphours/views/HistoryView';

// Импорт хуков
import { useDataManagement } from '../components/dphours/hooks/useDataManagement';
import { useEventFilters } from '../components/dphours/hooks/useEventFilters';
import { useEventGroups } from '../components/dphours/hooks/useEventGroups';

const DPHoursPage = () => {
  // Хуки управления данными и состоянием
  const { 
    data, loading, error, snackbar, showSnackbar, handleSnackbarClose,
    fetchData, addEvent, updateEvent, deleteEvent, deleteMultipleEvents
  } = useDataManagement();
  
  const {
    searchQuery, setSearchQuery,
    getEventsForDate, getFilteredEventsForDate,
    getUniqueLocationsForDate, getFilteredDatesWithEvents,
    getPaginatedItems, getEventsForToday, getDatesWithEvents
  } = useEventFilters();
  
  const {
    getGroupedEventsForDate,
    getFilteredLocationsForDate,
    getFilteredEventsForLocation
  } = useEventGroups();

  // Состояние вкладок и UI
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // current date by default
  );
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  
  // Пагинация для истории
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);

  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isLocationEditDialogOpen, setIsLocationEditDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  
  // Состояние форм
  const [complexAdd, setComplexAdd] = useState<ComplexAddState>({
    open: false,
    date: new Date().toISOString().split('T')[0],
    location: '',
    operations: []
  });
  const [locationEditData, setLocationEditData] = useState<LocationEditData | null>(null);
  const [editFormData, setEditFormData] = useState<DPHours | null>(null);
  
  // Мемоизированные данные
  const eventsForSelectedDate = useMemo(() => {
    return getEventsForToday(data, selectedDate);
  }, [data, selectedDate, getEventsForToday]);
  
  const datesWithEvents = useMemo(() => {
    return getDatesWithEvents(data);
  }, [data, getDatesWithEvents]);
  
  const filteredDatesWithEvents = useMemo(() => {
    return getFilteredDatesWithEvents(data);
  }, [data, getFilteredDatesWithEvents]);
  
  const paginatedDatesWithEvents = useMemo(() => {
    return getPaginatedItems(filteredDatesWithEvents, historyPage, historyRowsPerPage);
  }, [filteredDatesWithEvents, historyPage, historyRowsPerPage, getPaginatedItems]);

  // Обработчики взаимодействий с интерфейсом
  
  // Переключение вкладок
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Переключение развернутого раздела истории
  const toggleDateExpansion = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
    }
  };
  
  // Обработчик поиска
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Сбрасываем на первую страницу при изменении поиска
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

  // Функции для работы с операциями DP

  // Открытие диалога комплексного добавления
  const handleOpenComplexAdd = () => {
    setComplexAdd({
      open: true,
      date: selectedDate,
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
    
    const sortedOperations = [...complexAdd.operations].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    
    try {
      for (const op of sortedOperations) {
        await addEvent({
          date: complexAdd.date,
          time: op.time,
          location: complexAdd.location,
          operationType: op.operationType
        });
      }
      
      setComplexAdd({
        ...complexAdd,
        open: false
      });
      
      showSnackbar(`Добавлено ${sortedOperations.length} событий`, 'success');
    } catch (err) {
      console.error('Failed to add events:', err);
      showSnackbar('Не удалось добавить события', 'error');
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

  // История: добавление новой операции в локацию
  const handleAddLocationOperation = () => {
    if (locationEditData) {
      // Создаем новую операцию с временным id и проверяем, что все поля инициализированы
      const newOperation: DPHours = {
        id: `temp-${Date.now()}`,
        date: locationEditData.date,
        location: locationEditData.newLocation || '',
        time: '',
        operationType: 'DP Setup'
      };
      
      // Добавляем новую операцию к существующим
      setLocationEditData({
        ...locationEditData,
        events: [...locationEditData.events, newOperation]
      });
    }
  };

  // История: удаление операций локации
  const handleDeleteLocationEvents = async (events: DPHours[]) => {
    try {
      const eventIds = events.map(event => event.id);
      const success = await deleteMultipleEvents(eventIds);
      
      if (success) {
        showSnackbar('Локация успешно удалена', 'success');
      } else {
        showSnackbar('Не удалось удалить все операции', 'error');
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
      showSnackbar('Не удалось удалить локацию', 'error');
    }
  };

  // История: сохранение изменений локации
  const handleSaveLocationEdit = async () => {
    if (!locationEditData) return;
    
    // Проверяем наличие локации
    if (!locationEditData.newLocation || locationEditData.newLocation.trim() === '') {
      showSnackbar('Пожалуйста, укажите название локации', 'warning');
      return;
    }
    
    // Проверяем наличие даты
    if (!locationEditData.date || locationEditData.date.trim() === '') {
      showSnackbar('Пожалуйста, укажите дату', 'warning');
      return;
    }
    
    // Проверяем, заполнены ли все обязательные поля операций
    const hasEmptyFields = locationEditData.events.some(event => 
      !event.time || event.time.trim() === '' || 
      !event.operationType
    );
    
    if (hasEmptyFields) {
      showSnackbar('Пожалуйста, заполните все поля для операций', 'warning');
      return;
    }
    
    try {
      // Сортируем операции по времени перед сохранением
      const sortedEvents = [...locationEditData.events].sort((a, b) => 
        a.time.localeCompare(b.time)
      );
      
      for (const event of sortedEvents) {
        const eventId = event.id;
        const isNewRecord = !eventId || String(eventId).startsWith('temp-');
        
        const eventData = {
          date: locationEditData.date,
          time: event.time,
          location: locationEditData.newLocation,
          operationType: event.operationType
        };
        
        if (isNewRecord) {
          await addEvent(eventData);
        } else {
          await updateEvent(eventId, eventData);
        }
      }
      
      setIsLocationEditDialogOpen(false);
      setLocationEditData(null);
      showSnackbar('Записи успешно обновлены', 'success');
      
      // Обновляем данные с сервера для синхронизации
      await fetchData();
    } catch (error) {
      console.error('Failed to update location:', error);
      showSnackbar('Не удалось обновить записи', 'error');
    }
  };

  // Основной компонент: обработчик редактирования записи
  const handleEditOperation = (operation: DPHours) => {
    setEditFormData({
      id: operation.id,
      date: operation.date,
      location: operation.location,
      time: operation.time,
      operationType: operation.operationType
    });
    
    setIsEditDialogOpen(true);
  };

  // Обработчик сохранения изменений отдельной записи
  const handleSaveEdit = async () => {
    if (!editFormData?.id) return;
    
    try {
      const success = await updateEvent(editFormData.id, editFormData);
      
      if (success) {
        setIsEditDialogOpen(false);
        setEditFormData(null);
        showSnackbar('Operation updated successfully', 'success');
      } else {
        showSnackbar('Failed to update operation', 'error');
      }
    } catch (error) {
      console.error('Failed to update operation:', error);
      showSnackbar('Failed to update operation', 'error');
    }
  };

  // Обработчик удаления отдельной записи
  const handleDeleteOperation = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) {
      return;
    }
    
    try {
      const success = await deleteEvent(id);
      
      if (success) {
        // Если открыт диалог редактирования, закрываем его
        if (editFormData?.id === id) {
          setIsEditDialogOpen(false);
          setEditFormData(null);
        }
        
        showSnackbar('Operation deleted successfully', 'success');
      } else {
        showSnackbar('Failed to delete operation', 'error');
      }
    } catch (err) {
      console.error('Failed to delete operation:', err);
      showSnackbar('Failed to delete operation', 'error');
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

  // Обработчик удаления группы локаций для вкладки Today
  const handleDeleteLocationAdapter = (id: string) => {
    if (!id) return;
    
    // Находим событие по ID
    const targetEvent = data.find(item => String(item.id) === String(id));
    if (!targetEvent) return;
    
    // Получаем все события для этой даты и локации
    const dateEvents = data.filter(item => 
      item.date === targetEvent.date && 
      item.location === targetEvent.location
    );
    
    // Сортируем события по времени
    const sortedEvents = [...dateEvents].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    
    // Разбиваем на группы по DP OFF
    const groups: DPHours[][] = [];
    let currentGroup: DPHours[] = [];
    
    sortedEvents.forEach(event => {
      // Добавляем событие в текущую группу
      currentGroup.push(event);
      
      // Если это DP OFF, начинаем новую группу
      if (event.operationType === 'DP OFF') {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    });
    
    // Добавляем последнюю группу, если она не пустая
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Находим группу, которая содержит наше событие
    const targetGroupIndex = groups.findIndex(group => 
      group.some(event => String(event.id) === String(id))
    );
    
    if (targetGroupIndex !== -1 && groups[targetGroupIndex].length > 0) {
      const targetGroup = groups[targetGroupIndex];
      
      // Подтверждение удаления
      if (window.confirm(`Вы уверены, что хотите удалить эту группу операций?`)) {
        handleDeleteLocationEvents(targetGroup);
      }
    }
  };

  // Функции для передачи в дочерние компоненты
  
  // Функция для получения отфильтрованных локаций для даты
  const getFilteredLocationsHandler = (date: string) => {
    const groupedEvents = getGroupedEventsForDate(date, data);
    return getFilteredLocationsForDate(date, searchQuery, data, groupedEvents);
  };

  // Функция для получения группированных событий для даты
  const getGroupedEventsHandler = (date: string) => {
    return getGroupedEventsForDate(date, data);
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
        <TodayView 
          eventsForSelectedDate={eventsForSelectedDate}
          selectedDate={selectedDate}
          onOpenComplexAdd={handleOpenComplexAdd}
          onEdit={updateEvent}
          onEditLocation={handleEditLocation}
          onDeleteLocation={handleDeleteLocationAdapter}
        />
      )}
      
      {/* Content for "History" tab */}
      {tabValue === 1 && (
        <HistoryView 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          paginatedDates={paginatedDatesWithEvents}
          expandedDate={expandedDate}
          onToggleDateExpansion={toggleDateExpansion}
          filteredDates={filteredDatesWithEvents}
          page={historyPage - 1}
          rowsPerPage={historyRowsPerPage}
          onPageChange={handleHistoryPageChange}
          onRowsPerPageChange={handleHistoryRowsPerPageChange}
          getFilteredEventsForDate={(date) => getFilteredEventsForDate(date, data)}
          getFilteredLocationsForDate={getFilteredLocationsHandler}
          getGroupedEventsForDate={getGroupedEventsHandler}
          onEditLocation={handleEditLocation}
          onDeleteLocationEvents={handleDeleteLocationEvents}
        />
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
        onDeleteSingleOperation={handleDeleteOperation}
        onAddOperation={handleAddLocationOperation}
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