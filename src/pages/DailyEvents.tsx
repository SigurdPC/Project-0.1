import { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Alert, 
  CircularProgress, 
  Box, 
  Snackbar, 
  Paper, 
  Tabs, 
  Tab 
} from '@mui/material';
import { 
  Today as TodayIcon, 
  Timeline as TimelineIcon 
} from '@mui/icons-material';
import DataTable, { Column } from '../components/DataTable';
import SimpleDataTable from '../components/SimpleDataTable';
import DataTableWithSearch from '../components/DataTableWithSearch';
import { DailyEvent, OperationType } from '../types';
import dailyEventsApi from '../api/dailyEventsApi';
import { formatDate } from '../utils/dateUtils';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date', searchable: true },
  { id: 'startTime', label: 'Start Time', type: 'time', searchable: true },
  { id: 'endTime', label: 'End Time', type: 'time', searchable: true },
  { id: 'origin', label: 'Origin', searchable: true },
  { id: 'destination', label: 'Destination', searchable: true },
  { 
    id: 'operationType', 
    label: 'Operation Type', 
    type: 'select',
    options: ['In Port', 'In Transit', 'DP Operation', 'Standby'] as OperationType[],
    searchable: true
  },
  { id: 'consumptionME', label: 'Consumption M/E', type: 'number', searchable: true },
  { id: 'consumptionAE', label: 'Consumption A/E', type: 'number', searchable: true },
];

const DailyEvents = () => {
  const [data, setData] = useState<DailyEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Текущая дата для фильтрации в формате ISO
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Записи только для сегодняшнего дня
  const todayRecords = useMemo(() => {
    return data.filter(record => record.date === today);
  }, [data, today]);
  
  // Fetch data from API when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
  // Function to fetch all records from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await dailyEventsApi.getAll();
      setData(records);
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

  // Switch between tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAdd = async (newData: DailyEvent) => {
    setLoading(true);
    try {
      // Omit the id property as it will be generated by the server
      const { id, ...dataToSend } = newData;
      
      const savedRecord = await dailyEventsApi.create(dataToSend);
      setData([...data, savedRecord]);
      showSnackbar('Record added successfully', 'success');
    } catch (err) {
      console.error('Failed to add record:', err);
      showSnackbar('Failed to add record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, updatedData: DailyEvent) => {
    setLoading(true);
    try {
      // Omit the id property from the data to send
      const { id: _, ...dataToSend } = updatedData;
      
      await dailyEventsApi.update(id, dataToSend);
      setData(data.map((item) => (item.id === id ? updatedData : item)));
      showSnackbar('Record updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update record:', err);
      showSnackbar('Failed to update record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setLoading(true);
    try {
      await dailyEventsApi.delete(id);
      setData(data.filter((item) => item.id !== id));
      showSnackbar('Record deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete record:', err);
      showSnackbar('Failed to delete record', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Daily Events
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
              Events for Today ({formatDate(today)})
            </Typography>
          </Box>
          
          <SimpleDataTable
            columns={columns}
            data={todayRecords}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          {todayRecords.length === 0 && !loading && (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No events for today
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Content for "History" tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <DataTableWithSearch
            columns={columns}
            data={data}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="All Events"
          />
          
          {data.length === 0 && !loading && (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No events found
            </Typography>
          )}
        </Paper>
      )}
      
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

export default DailyEvents; 