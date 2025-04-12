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
import { useValidation } from '../hooks/useValidation';

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

  // Используем хук валидации для проверки дубликатов
  // Для DailyEvents уникальными полями являются date, startTime, endTime
  const { checkDuplicate } = useValidation<DailyEvent>(
    data,
    ['date', 'startTime', 'endTime']
  );

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

      // Проверка на дубликаты перед отправкой на сервер
      if (checkDuplicate(dataToSend)) {
        showSnackbar('Cannot add duplicate record. A record with the same date, start time and end time already exists.', 'error');
        setLoading(false);
        return false;
      }

      const savedRecord = await dailyEventsApi.create(dataToSend);
      setData([...data, savedRecord]);
      showSnackbar('Record added successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to add record:', err);

      // Проверка на ошибку дубликата с сервера
      if (err.message && err.message.includes('Duplicate')) {
        showSnackbar(err.message, 'error');
      } else {
        showSnackbar('Failed to add record', 'error');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, updatedData: DailyEvent) => {
    setLoading(true);
    try {
      // Omit the id property from the data to send
      const { id: _, ...dataToSend } = updatedData;

      // Проверка на дубликаты перед отправкой на сервер (исключая текущую запись)
      if (checkDuplicate(dataToSend, id)) {
        showSnackbar('Cannot update to duplicate record. A record with the same date, start time and end time already exists.', 'error');
        setLoading(false);
        return false;
      }

      await dailyEventsApi.update(id, dataToSend);
      setData(data.map((item) => (item.id === id ? updatedData : item)));
      showSnackbar('Record updated successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to update record:', err);

      // Проверка на ошибку дубликата с сервера
      if (err.message && err.message.includes('Duplicate')) {
        showSnackbar(err.message, 'error');
      } else {
        showSnackbar('Failed to update record', 'error');
      }
      return false;
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
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3, fontWeight: 500 }}>
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
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Tabs for switching between modes */}
      <Paper sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontSize: '0.95rem',
              minHeight: '56px'
            }
          }}
        >
          <Tab icon={<TodayIcon />} label="Today" />
          <Tab icon={<TimelineIcon />} label="History" />
        </Tabs>
      </Paper>

      {/* Content for "Today" tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 4, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, position: 'relative' }}>
            <Typography variant="h6" sx={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontWeight: 500 }}>
              {formatDate(today)}
            </Typography>
          </Box>

          <DataTable
            columns={columns}
            data={todayRecords}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {todayRecords.length === 0 && !loading && (
            <Typography align="center" color="text.secondary" sx={{ py: 6, fontSize: '1.1rem' }}>
              No events for today
            </Typography>
          )}
        </Paper>
      )}

      {/* Content for "History" tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 4, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <DataTable
            columns={columns}
            data={data}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {data.length === 0 && !loading && (
            <Typography align="center" color="text.secondary" sx={{ py: 6, fontSize: '1.1rem' }}>
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
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DailyEvents; 