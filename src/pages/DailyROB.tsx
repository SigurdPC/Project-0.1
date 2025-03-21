import { useState, useEffect } from 'react';
import { Container, Typography, Alert, CircularProgress, Box, Snackbar } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import type { DailyROB as DailyROBType } from '../types';
import dailyROBsApi from '../api/dailyROBsApi';

const columns: Column[] = [
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'startTime', label: 'Start Time', type: 'time' },
  { id: 'endTime', label: 'End Time', type: 'time' },
  { id: 'origin', label: 'Origin' },
  { id: 'destination', label: 'Destination' },
  { id: 'operationType', label: 'Operation Type' },
  { id: 'consumptionME', label: 'Consumption M/E', type: 'number' },
  { id: 'consumptionAE', label: 'Consumption A/E', type: 'number' },
];

const DailyROB = () => {
  const [data, setData] = useState<DailyROBType[]>([]);
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

  // Fetch data from API when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
  // Function to fetch all records from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await dailyROBsApi.getAll();
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

  const handleAdd = async (newData: DailyROBType) => {
    setLoading(true);
    try {
      // Omit the id property as it will be generated by the server
      const { id, ...dataToSend } = newData;
      
      const savedRecord = await dailyROBsApi.create(dataToSend);
      setData([...data, savedRecord]);
      showSnackbar('Record added successfully', 'success');
    } catch (err) {
      console.error('Failed to add record:', err);
      showSnackbar('Failed to add record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, updatedData: DailyROBType) => {
    setLoading(true);
    try {
      // Omit the id property from the data to send
      const { id: _, ...dataToSend } = updatedData;
      
      await dailyROBsApi.update(id, dataToSend);
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
      await dailyROBsApi.delete(id);
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
        Daily ROB
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
      
      <DataTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
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

export default DailyROB; 