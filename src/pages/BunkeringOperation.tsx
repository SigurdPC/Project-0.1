import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Snackbar,
  Paper,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  Today as TodayIcon,
  MenuBook as MenuBookIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import DataTable, { Column } from '../components/DataTable';
import { BunkeringOperation as BunkeringOperationType, FuelType } from '../types';
import bunkeringOperationsApi from '../api/bunkeringOperationsApi';
import { formatDate } from '../utils/dateUtils';
import { useValidation } from '../hooks/useValidation';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date', searchable: true },
  {
    id: 'fuelType',
    label: 'Fuel Type',
    type: 'select',
    options: ['ULSD', 'Change XL', 'Other'] as FuelType[],
    searchable: true
  },
  { id: 'density', label: 'Density', type: 'number', searchable: true },
  { id: 'timeStart', label: 'Time Start', type: 'time', searchable: true },
  { id: 'timeStop', label: 'Time Stop', type: 'time', searchable: true },
  { id: 'received', label: 'Received', type: 'number', searchable: true },
];

const BunkeringOperation = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BunkeringOperationType[]>([]);
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
  // Для Bunkering Operations уникальными полями являются date, fuelType, timeStart
  const { checkDuplicate } = useValidation<BunkeringOperationType>(
    data,
    ['date', 'fuelType', 'timeStart']
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
      const records = await bunkeringOperationsApi.getAll();
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
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAdd = async (newData: BunkeringOperationType) => {
    setLoading(true);
    try {
      // Omit the id property as it will be generated by the server
      const { id, ...dataToSend } = newData;

      // Проверка на дубликаты перед отправкой на сервер
      if (checkDuplicate(dataToSend)) {
        showSnackbar('Cannot add duplicate record. A record with the same date, fuel type and start time already exists.', 'error');
        setLoading(false);
        return;
      }

      const savedRecord = await bunkeringOperationsApi.create(dataToSend);
      setData([...data, savedRecord]);
      showSnackbar('Record added successfully', 'success');
    } catch (err: any) {
      console.error('Failed to add record:', err);

      // Проверка на ошибку дубликата с сервера
      if (err.message && err.message.includes('Duplicate')) {
        showSnackbar(err.message, 'error');
      } else {
        showSnackbar('Failed to add record', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, updatedData: BunkeringOperationType) => {
    setLoading(true);
    try {
      // Omit the id property from the data to send
      const { id: _, ...dataToSend } = updatedData;

      // Проверка на дубликаты перед отправкой на сервер (исключая текущую запись)
      if (checkDuplicate(dataToSend, id)) {
        showSnackbar('Cannot update to duplicate record. A record with the same date, fuel type and start time already exists.', 'error');
        setLoading(false);
        return;
      }

      await bunkeringOperationsApi.update(id, dataToSend);
      setData(data.map((item) => (item.id === id ? updatedData : item)));
      showSnackbar('Record updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update record:', err);

      // Проверка на ошибку дубликата с сервера
      if (err.message && err.message.includes('Duplicate')) {
        showSnackbar(err.message, 'error');
      } else {
        showSnackbar('Failed to update record', 'error');
      }
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
      await bunkeringOperationsApi.delete(id);
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
          variant="contained"
          sx={{ 
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 500,
            py: 1,
            px: 2
          }}
        >
          Home
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 500, flexGrow: 1, textAlign: 'center' }}>
          Bunkering Operation
        </Typography>
        <Box sx={{ width: '120px' }} /> {/* Spacer to center the title */}
      </Box>

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
          <Tab icon={<MenuBookIcon />} label="History" />
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
              No operations for today
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
              No operations found
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

export default BunkeringOperation; 