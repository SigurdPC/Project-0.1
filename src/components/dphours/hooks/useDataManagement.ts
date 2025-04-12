import { useState, useCallback, useEffect } from 'react';
import dphoursApi from '../../../api/dphoursApi';
import { DPHours, OperationType, SnackbarState } from '../types';

export interface DataManagementHook {
  data: DPHours[];
  loading: boolean;
  error: string | null;
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  handleSnackbarClose: () => void;
  fetchData: () => Promise<void>;
  addEvent: (event: Omit<DPHours, 'id'>) => Promise<DPHours | null>;
  updateEvent: (id: string, updatedData: Partial<DPHours>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  deleteMultipleEvents: (eventIds: string[]) => Promise<boolean>;
  setData: React.Dispatch<React.SetStateAction<DPHours[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  checkDuplicate: (record: Omit<DPHours, 'id'>) => boolean;
}

export const useDataManagement = (): DataManagementHook => {
  const [data, setData] = useState<DPHours[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Function to show snackbar notification
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);
  
  // Handle snackbar close
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Fetch data from the API
  const fetchData = useCallback(async () => {
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
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if record would be a duplicate
  const checkDuplicate = useCallback((record: Omit<DPHours, 'id'>): boolean => {
    return data.some(existingRecord => 
      existingRecord.date === record.date && 
      existingRecord.time === record.time && 
      existingRecord.location === record.location
    );
  }, [data]);

  // Add new event
  const addEvent = useCallback(async (event: Omit<DPHours, 'id'>): Promise<DPHours | null> => {
    try {
      const savedRecord = await dphoursApi.createRecord({
        date: event.date,
        time: event.time,
        location: event.location,
        operationType: event.operationType as OperationType
      });
      
      const newId = savedRecord.id || Date.now().toString();
      const fullEvent: DPHours = {
        id: newId,
        date: savedRecord.date,
        time: savedRecord.time,
        location: savedRecord.location,
        operationType: savedRecord.operationType
      };
      
      setData(prev => [...prev, fullEvent]);
      return fullEvent;
    } catch (err: any) {
      console.error('Failed to add event:', err);
      
      // Check if it's an axios error with response data
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.message || 'Failed to add event';
        showSnackbar(errorMessage, 'error');
        
        // If the error is about duplicate record, throw it so the UI can handle it
        if (errorMessage.includes('Duplicate')) {
          throw new Error(errorMessage);
        }
      } else {
        showSnackbar('Failed to add event', 'error');
      }
      
      return null;
    }
  }, [showSnackbar]);

  // Update event
  const updateEvent = useCallback(async (id: string, updatedData: Partial<DPHours>): Promise<boolean> => {
    try {
      // Ensure all required fields are present
      const currentRecord = data.find(item => item.id === id);
      if (!currentRecord) return false;
      
      const recordToUpdate = {
        date: updatedData.date || currentRecord.date,
        time: updatedData.time || currentRecord.time,
        location: updatedData.location || currentRecord.location,
        operationType: updatedData.operationType || currentRecord.operationType
      };
      
      await dphoursApi.updateRecord(id, recordToUpdate);
      
      setData(prev => prev.map((item) => (
        item.id === id ? { ...item, ...updatedData } : item
      )));
      
      return true;
    } catch (err: any) {
      console.error('Failed to update record:', err);
      
      // Check if it's an axios error with response data
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.message || 'Failed to update record';
        showSnackbar(errorMessage, 'error');
        
        // If the error is about duplicate record, throw it so the UI can handle it
        if (errorMessage.includes('Duplicate')) {
          throw new Error(errorMessage);
        }
      } else {
        showSnackbar('Failed to update record', 'error');
      }
      
      return false;
    }
  }, [data, showSnackbar]);

  // Удаление отдельного события по ID
  const deleteEvent = async (id: string): Promise<boolean> => {
    if (!id || id === '') {
      console.error('deleteEvent: Invalid ID provided', id);
      return false;
    }

    // Пропускаем временные ID, которые начинаются с 'temp-'
    if (id.startsWith('temp-')) {
      console.log(`Skipping temporary ID: ${id}`);
      
      // Обновляем локальное состояние, удаляя запись с указанным ID
      setData(prevData => {
        const filtered = prevData.filter(item => String(item.id) !== id);
        console.log(`Filtered out temp ID ${id}. Before: ${prevData.length}, After: ${filtered.length}`);
        return filtered;
      });
      
      return true;
    }

    try {
      console.log(`Deleting event with ID: ${id}`);
      await dphoursApi.deleteRecord(id);
      
      // Обновляем локальное состояние, удаляя запись с указанным ID
      setData(prevData => {
        // Важно привести ID к строке для надежного сравнения
        const filtered = prevData.filter(item => String(item.id) !== String(id));
        console.log(`Filtered out permanent ID ${id}. Before: ${prevData.length}, After: ${filtered.length}`);
        if (prevData.length === filtered.length) {
          console.warn(`No items were removed from data state for ID: ${id}`);
          console.log('Current IDs in state:', prevData.map(item => item.id));
        }
        return filtered;
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to delete event with ID: ${id}`, error);
      return false;
    }
  };
  
  // Удаление нескольких записей DP Hours по массиву ID
  const deleteMultipleEvents = async (ids: string[]): Promise<boolean> => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('deleteMultipleEvents: Empty or invalid ids array', ids);
      return Promise.reject(new Error('Invalid IDs provided for deletion'));
    }

    // Фильтруем только валидные ID
    const validIds = ids.filter(id => id !== undefined && id !== null && id !== '');
    
    if (validIds.length === 0) {
      console.error('deleteMultipleEvents: No valid IDs after filtering', ids);
      return Promise.reject(new Error('No valid IDs to delete'));
    }

    console.log(`Deleting ${validIds.length} events with IDs:`, validIds);

    try {
      // Используем Promise.all для параллельного удаления всех элементов
      const results = await Promise.all(
        validIds.map(id => deleteEvent(id))
      );
      
      // Проверяем, все ли операции удаления прошли успешно
      const allSuccessful = results.every(result => result === true);
      
      if (allSuccessful) {
        console.log(`Successfully deleted all ${validIds.length} events`);
        return true;
      } else {
        const failedCount = results.filter(result => result !== true).length;
        console.error(`Failed to delete ${failedCount} out of ${validIds.length} events`);
        return Promise.reject(new Error(`Failed to delete ${failedCount} events`));
      }
    } catch (error) {
      console.error('Error in deleteMultipleEvents:', error);
      return Promise.reject(error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    snackbar,
    showSnackbar,
    handleSnackbarClose,
    fetchData,
    addEvent,
    updateEvent,
    deleteEvent,
    deleteMultipleEvents,
    setData,
    setLoading,
    checkDuplicate
  };
}; 