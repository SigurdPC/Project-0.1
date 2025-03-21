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
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add Event
            </Button>
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