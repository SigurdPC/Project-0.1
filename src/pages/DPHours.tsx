import React, { useState, useMemo } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, Tabs, Tab, List, ListItem, ListItemText, 
  ListItemSecondaryAction, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, 
  MenuItem, Divider, Grid,
  Collapse
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

// Define operation type
type OperationType = 'DP Setup' | 'Moving in' | 'Handling Offshore' | 'Pulling Out' | 'DP OFF';

// Define DPHours interface
interface DPHours {
  id: string;
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
  duration: number; // в минутах
}

// Define colors for different operation types
const operationColors: Record<OperationType, string> = {
  'DP Setup': '#4caf50',      // green
  'Moving in': '#2196f3',     // blue
  'Handling Offshore': '#ff9800', // orange
  'Pulling Out': '#9c27b0',   // purple 
  'DP OFF': '#f44336'         // red
};

const DPHoursPage = () => {
  const [data, setData] = useState<DPHours[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // current date by default
  );
  const [tabValue, setTabValue] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [dpSessions, setDpSessions] = useState<DPSession[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<DPHours>>({
    date: selectedDate,
    time: '',
    location: '',
    operationType: 'DP Setup'
  });
  
  // Handle changes in the new event form
  const handleNewEventChange = (field: keyof DPHours, value: string) => {
    setNewEvent({
      ...newEvent,
      [field]: value
    });
  };
  
  // Add new event
  const handleAddEvent = () => {
    if (!newEvent.date || !newEvent.time || !newEvent.location || !newEvent.operationType) {
      alert('Please fill in all fields');
      return;
    }
    
    const newId = Date.now().toString();
    const fullEvent: DPHours = {
      id: newId,
      date: newEvent.date!,
      time: newEvent.time!,
      location: newEvent.location!,
      operationType: newEvent.operationType as OperationType
    };
    
    setData([...data, fullEvent]);
    setIsAddDialogOpen(false);
    
    // Reset form but keep the current date
    setNewEvent({
      date: selectedDate,
      time: '',
      location: '',
      operationType: 'DP Setup'
    });
  };
  
  // Switch between tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Edit record function
  const handleEdit = (id: string, updatedData: DPHours) => {
    setData(data.map((item) => (item.id === id ? updatedData : item)));
  };

  // Delete record function
  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
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
  const calculateDPSessions = (startDate: string, endDate: string) => {
    // Отфильтруем события по указанному диапазону дат
    const filteredEvents = data.filter(event => {
      return event.date >= startDate && event.date <= endDate;
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
          // Если предыдущая сессия не завершилась, завершаем её с нулевой длительностью
          sessions.push({
            startDate: currentSession.startDate,
            startTime: currentSession.startTime,
            endDate: null,
            endTime: null,
            location: currentSession.location,
            duration: 0
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
      sessions.push({
        startDate: currentSession.startDate,
        startTime: currentSession.startTime,
        endDate: null,
        endTime: null,
        location: currentSession.location,
        duration: 0
      });
    }
    
    return sessions;
  };
  
  // Функция для форматирования длительности в часах и минутах
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "В процессе";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };
  
  // Подсчет общего времени
  const calculateTotalDuration = (sessions: DPSession[]) => {
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    return formatDuration(totalMinutes);
  };
  
  // Обработчик для открытия диалога статистики
  const handleOpenStats = () => {
    const sessions = calculateDPSessions(dateRange.start, dateRange.end);
    setDpSessions(sessions);
    setIsStatsDialogOpen(true);
  };
  
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        DP Hours
      </Typography>
      
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
          <Tab icon={<TimelineIcon />} label="All Records" />
        </Tabs>
      </Paper>
      
      {/* Content for "Today" tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Events for Today ({new Date().toLocaleDateString()})
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
      
      {/* Content for "All Records" tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              All Records
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={handleOpenStats}
              >
                Статистика DP
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
                    <Typography variant="h6">{date}</Typography>
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
        <DialogTitle>Статистика DP времени</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Начало периода"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Конец периода"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                onClick={() => {
                  const sessions = calculateDPSessions(dateRange.start, dateRange.end);
                  setDpSessions(sessions);
                }}
                fullWidth
                sx={{ height: '56px' }}
              >
                Обновить
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Общее время работы: {calculateTotalDuration(dpSessions)}
          </Typography>
          
          {dpSessions.length > 0 ? (
            <List>
              {dpSessions.map((session, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Начало:</Typography>
                        <Typography variant="body1">
                          {session.startDate} {session.startTime}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Окончание:</Typography>
                        <Typography variant="body1">
                          {session.endDate ? `${session.endDate} ${session.endTime}` : "Не завершено"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Локация:</Typography>
                        <Typography variant="body1">{session.location}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">Длительность:</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatDuration(session.duration)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              Нет данных за выбранный период
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsStatsDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
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