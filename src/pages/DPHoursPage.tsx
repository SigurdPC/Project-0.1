import React, { useState, useMemo, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, 
  Tabs, Tab, 
  Alert, CircularProgress, Snackbar
} from '@mui/material';
import { 
  Today as TodayIcon,
  MenuBook as MenuBookIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { 
  ComplexAddDialog, 
  EditLocationDialog, 
  EditOperationDialog 
} from '../components/dphours/Dialogs';
import { 
  DPHours, 
  ComplexAddState,
  LocationEditData,
  OperationType,
  TimeCalculationResult,
  DPTimeOperation,
  Shift
} from '../components/dphours/types';
import { 
  parseUserDateInput, 
  calculateOperationTimesByShifts,
  getDPTimeOperations
} from '../components/dphours/utils';

// Import components
import TodayView from '../components/dphours/views/TodayView';
import HistoryView from '../components/dphours/views/HistoryView';
import DPTimeSettings from '../components/dphours/views/DPTimeSettings';
import DPTimeResults from '../components/dphours/views/DPTimeResults';

// Import hooks
import { useDataManagement } from '../components/dphours/hooks/useDataManagement';
import { useEventFilters } from '../components/dphours/hooks/useEventFilters';
import { useEventGroups } from '../components/dphours/hooks/useEventGroups';
import { useTheme } from '../providers/ThemeProvider';

interface Filters {
  startDate: string;
  endDate: string;
  location: string;
  operationType: OperationType | '';
}

interface DateRange {
  startDate: string;
  endDate: string;
  shifts: Shift[];
}

const DPHoursPage = () => {
  // Get night mode state
  const { isNightMode } = useTheme();
  
  // Data management and state hooks
  const { 
    data, loading, error, snackbar, showSnackbar, handleSnackbarClose,
    fetchData, addEvent, updateEvent, deleteEvent, deleteMultipleEvents,
    setData, setLoading
  } = useDataManagement();
  
  const {
    searchQuery, setSearchQuery,
    getFilteredEventsForDate,
    getFilteredDatesWithEvents,
    getPaginatedItems, getEventsForToday,
  } = useEventFilters();
  
  const {
    getGroupedEventsForDate,
    getFilteredLocationsForDate
  } = useEventGroups();

  // Tabs and UI state
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // current date by default
  );
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  
  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  
  // Dialog states
  const [isLocationEditDialogOpen, setIsLocationEditDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  
  // Form states
  const [complexAdd, setComplexAdd] = useState<ComplexAddState | null>(null);
  const [locationEditData, setLocationEditData] = useState<LocationEditData | null>(null);
  const [editFormData, setEditFormData] = useState<DPHours | null>(null);
  const [records, setRecords] = useState<DPHours[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date().toISOString().split('T')[0], // current date by default
    endDate: new Date().toISOString().split('T')[0],
    location: '',
    operationType: ''
  });

  // DP Time state
  const [dpTimeResults, setDpTimeResults] = useState<TimeCalculationResult[]>([]);
  const [dpTimeOperations, setDpTimeOperations] = useState<DPTimeOperation[]>([]);
  const [dpTimeResultsCalculated, setDpTimeResultsCalculated] = useState<boolean>(false);
  const [dpTimeSettings, setDpTimeSettings] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    shifts: [
      {
        id: Date.now().toString(),
        startTime: '08:00',
        endTime: '20:00',
        isOvernight: false
      }
    ]
  });

  // Convert data to DP Time operations when they change
  useEffect(() => {
    if (data) {
      const operations = getDPTimeOperations(data);
      setDpTimeOperations(operations);
    }
  }, [data]);

  // Memoized data
  const eventsForSelectedDate = useMemo(() => {
    if (!data) return [];
    return data.filter(event => event.date === selectedDate);
  }, [data, selectedDate]);
  
  const filteredDatesWithEvents = useMemo(() => {
    return getFilteredDatesWithEvents(data);
  }, [data, getFilteredDatesWithEvents]);
  
  const paginatedDatesWithEvents = useMemo(() => {
    return getPaginatedItems(filteredDatesWithEvents, historyPage, historyRowsPerPage);
  }, [filteredDatesWithEvents, historyPage, historyRowsPerPage, getPaginatedItems]);

  // UI interaction handlers
  
  // Tab switching
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Toggle expanded history section
  const toggleDateExpansion = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
    }
  };

  // Search handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Reset to the first page when search changes
    setHistoryPage(1);
  };
  
  // Pagination handlers
  const handleHistoryPageChange = (_: unknown, newPage: number) => {
    setHistoryPage(newPage + 1);
  };

  const handleHistoryRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(1);
  };
  
  // Functions for working with DP operations

  // Open complex add dialog
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
  
  // Close complex add dialog
  const handleCloseComplexAdd = () => {
    setComplexAdd(null);
  };
  
  // Change date or location in complex add
  const handleComplexAddBaseChange = (field: 'date' | 'location', value: string) => {
    if (field === 'date') {
      value = parseUserDateInput(value);
    }
    
    if (complexAdd) {
    setComplexAdd({
      ...complexAdd,
      [field]: value
    });
    }
  };
  
  // Add new operation to complex add
  const handleAddOperation = () => {
    if (complexAdd) {
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
    }
  };
  
  // Change operation in complex add
  const handleOperationChange = (id: string, field: 'time' | 'operationType', value: string) => {
    if (complexAdd) {
    setComplexAdd({
      ...complexAdd,
      operations: complexAdd.operations.map(op => 
        op.id === id ? { ...op, [field]: value } : op
      )
    });
    }
  };
  
  // Remove operation from complex add
  const handleRemoveOperation = (id: string) => {
    // Don't remove if only one operation left
    if (complexAdd && complexAdd.operations.length <= 1) return;
    
    if (complexAdd) {
    setComplexAdd({
      ...complexAdd,
      operations: complexAdd.operations.filter(op => op.id !== id)
    });
    }
  };
  
  // Save all operations from complex add
  const handleSaveComplexAdd = async () => {
    // Check for all fields filled
    if (!complexAdd || !complexAdd.date || !complexAdd.location) {
      showSnackbar('Please enter date and location', 'warning');
      return;
    }
    
    // Check that all operations have time
    if (complexAdd.operations.some(op => !op.time)) {
      showSnackbar('Please enter time for all operations', 'warning');
      return;
    }
    
    // Use operations in original order without sorting
    const operations = complexAdd.operations;
    
    try {
      for (const op of operations) {
        await addEvent({
          date: complexAdd.date,
          time: op.time,
          location: complexAdd.location,
          operationType: op.operationType
        });
      }
      
      setComplexAdd(null);
      
      showSnackbar(`Added ${operations.length} events`, 'success');
    } catch (err) {
      console.error('Failed to add events:', err);
      showSnackbar('Failed to add events', 'error');
    }
  };

  // History: handler for editing location
  const handleEditLocation = (date: string, location: string, events: DPHours[]) => {
    setIsLocationEditDialogOpen(true);
    setLocationEditData({
      date,
      oldLocation: location,
      newLocation: location,
      events
    });
  };
  
  // History: cancel editing location
  const handleCancelLocationEdit = () => {
    setIsLocationEditDialogOpen(false);
    setLocationEditData(null);
  };
  
  // History: change location name
  const handleLocationNameChange = (value: string) => {
    if (locationEditData) {
      setLocationEditData({
        ...locationEditData,
        newLocation: value
      });
    }
  };

  // History: change date for all operations
  const handleLocationDateChange = (value: string) => {
    if (locationEditData) {
      // Convert date to correct format
      const formattedDate = parseUserDateInput(value);
      
      // Create copy of events with updated date
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

  // History: change operation data in edit location dialog
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

  // History: add new operation to location
  const handleAddLocationOperation = () => {
    if (locationEditData) {
      // Create new operation with temporary id and check that all fields are initialized
      const newOperation: DPHours = {
        id: `temp-${Date.now()}`,
        date: locationEditData.date,
        location: locationEditData.newLocation || '',
        time: '',
        operationType: 'DP Setup'
      };
      
      // Add new operation to existing list at the end
      setLocationEditData({
        ...locationEditData,
        events: [...locationEditData.events, newOperation]
      });
    }
  };

  // Delete group of events by one location
  const handleDeleteLocationEvents = (events: DPHours[]) => {
    if (!events || events.length === 0) {
      console.error('handleDeleteLocationEvents: No events provided');
      showSnackbar('Failed to delete: empty events array', 'error');
      return;
    }
    
    console.log(`Attempting to delete ${events.length} events`);
    
    // Extract all valid IDs from events array
    const idsToDelete = events
      .filter(event => event && event.id) // Ensure event has ID
      .map(event => String(event.id));    // Convert all IDs to strings
    
    if (idsToDelete.length === 0) {
      console.error('No valid IDs found for deletion');
      showSnackbar('Failed to delete: No valid IDs found', 'error');
      return;
    }

    console.log(`Deleting ${idsToDelete.length} events with IDs:`, idsToDelete);
    
    // Call multiple records deletion function
    deleteMultipleEvents(idsToDelete)
      .then(() => {
        console.log('Successfully deleted events:', idsToDelete.length);
        showSnackbar(`Successfully deleted ${idsToDelete.length} events.`, 'success');
        
        // Update data
        fetchData();
      })
      .catch(error => {
        console.error('Error deleting events:', error);
        showSnackbar('Failed to delete events: ' + (error.message || 'Unknown error'), 'error');
      });
  };

  // Handler for saving changes to single record
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
  
  // Handler for saving location (group of events)
  const handleSaveLocation = async () => {
    if (!locationEditData) return;
    
    try {
      // Use events in the order they are presented in the interface
      const events = locationEditData.events;
      
      for (const event of events) {
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
      showSnackbar('Records updated successfully', 'success');
      
      // Update data from server for synchronization
      await fetchData();
    } catch (error) {
      console.error('Failed to update location:', error);
      showSnackbar('Failed to update records', 'error');
    }
  };

  // Handler for deleting single record
  const handleDeleteOperation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this operation?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Convert ID to string for safety
      const operationId = String(id);
      
      // Check if this is a temporary ID
      if (operationId.startsWith('temp-')) {
        // For temporary IDs, update only state without API request
        setData((prev: DPHours[]) => prev.filter((item: DPHours) => String(item.id) !== operationId));
        setIsEditDialogOpen(false);
        setEditFormData(null);
        showSnackbar('Operation deleted successfully', 'success');
        setLoading(false);
        return;
      }
      
      const success = await deleteEvent(operationId);
      
      if (success) {
        // If edit dialog is open, close it
        if (editFormData?.id === operationId) {
          setIsEditDialogOpen(false);
          setEditFormData(null);
        }
        // Update operations list in edit location dialog if open
        if (locationEditData && locationEditData.events.some(event => String(event.id) === operationId)) {
          if (locationEditData.events.length <= 1) {
            // If this is the last operation in location, close dialog
            setIsLocationEditDialogOpen(false);
            setLocationEditData(null);
          } else {
            // Otherwise, update operations list
            setLocationEditData({
              ...locationEditData,
              events: locationEditData.events.filter(event => String(event.id) !== operationId)
            });
          }
        }
        
        // Update data after deletion
        await fetchData();
        showSnackbar('Operation deleted successfully', 'success');
      } else {
        showSnackbar('Failed to delete operation', 'error');
      }
    } catch (err) {
      console.error('Failed to delete operation:', err);
      showSnackbar('Failed to delete operation', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for changing data in edit form
  const handleFormChange = (field: keyof DPHours, value: any) => {
    if (editFormData) {
      // If this is date field and user entered in dd/mm/yyyy format
      if (field === 'date') {
        value = parseUserDateInput(value);
      }
      
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };
  
  // Handler for deleting group of locations for Today tab
  const handleDeleteLocationAdapter = (idOrEvents: string | DPHours[]) => {
    console.log('handleDeleteLocationAdapter called with:', typeof idOrEvents, idOrEvents);
    
    // Check if parameter is events array
    if (Array.isArray(idOrEvents)) {
      // If we passed events array, directly call deletion function
      if (idOrEvents.length > 0) {
        console.log('Direct deletion of events array', idOrEvents.length, 'events');
        
        // Confirm deletion
        const location = idOrEvents[0]?.location || 'selected location';
        if (window.confirm(`Are you sure you want to delete all operations for location "${location}"?`)) {
          handleDeleteLocationEvents(idOrEvents);
        }
      } else {
        console.error('Cannot delete: Empty events array');
        showSnackbar('Failed to delete: empty events array', 'error');
      }
      return;
    }
    
    // If parameter is string ID, find related events
    const id = idOrEvents;
    if (!id) {
      console.error('handleDeleteLocationAdapter: No ID provided');
      showSnackbar('Cannot delete: No ID provided', 'error');
      return;
    }
    
    console.log('Deletion by ID:', id);
    
    // Find event by ID
    const targetEvent = data.find(item => String(item.id) === String(id));
    if (!targetEvent) {
      console.error('Event not found for deletion:', id);
      showSnackbar('Failed to find event for deletion', 'error');
      return;
    }
    
    // Get all events for this date and location
    const dateEvents = data.filter(item => 
      item.date === targetEvent.date && 
      item.location === targetEvent.location
    );
    
    if (dateEvents.length === 0) {
      console.error('No events found for this location', {
        id,
        date: targetEvent.date,
        location: targetEvent.location
      });
      showSnackbar('Failed to find events for deletion', 'error');
      return;
    }
    
    console.log(`Found ${dateEvents.length} events to delete for location "${targetEvent.location}"`);
      
      // Confirm deletion
    if (window.confirm(`Are you sure you want to delete all operations for location "${targetEvent.location}"?`)) {
      // Check that all events have ID
      const eventsWithIds = dateEvents.filter(event => event.id);
      if (eventsWithIds.length !== dateEvents.length) {
        console.warn(`Some events (${dateEvents.length - eventsWithIds.length}) don't have IDs`);
      }
      
      if (eventsWithIds.length > 0) {
        // Pass only events with ID for deletion
        handleDeleteLocationEvents(eventsWithIds);
      } else {
        console.error('No events with IDs to delete');
        showSnackbar('Failed to delete: No valid events found', 'error');
      }
    }
  };

  // Functions for passing to child components
  
  // Function for getting filtered locations for date
  const getFilteredLocationsHandler = (date: string) => {
    const groupedEvents = getGroupedEventsForDate(date, data);
    return getFilteredLocationsForDate(date, searchQuery, data, groupedEvents);
  };

  // Function for getting grouped events for date
  const getGroupedEventsHandler = (date: string) => {
    return getGroupedEventsForDate(date, data);
  };

  // Handler for changing date
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    value = parseUserDateInput(value);
    setFilters((prev: Filters) => ({ ...prev, [field]: value }));
  };

  // Handler for adding record
  const handleAddRecord = () => {
    const newRecord: DPHours = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: '00:00',
      location: '',
      operationType: 'DP Setup' as OperationType
    };
    setRecords((prev: DPHours[]) => [...prev, newRecord]);
  };

  // Handler for changing value in table
  const handleCellChange = (id: string, field: keyof DPHours, value: any) => {
    if (field === 'date') {
      value = parseUserDateInput(value);
    }
    setRecords((prev: DPHours[]) => 
      prev.map((record: DPHours) => 
        record.id === id ? { ...record, [field]: value } : record
      )
    );
  };

  // DP Time handlers
  const handleDpTimeStartDateChange = (date: string) => {
    setDpTimeSettings((prev: DateRange) => ({ ...prev, startDate: date }));
  };
  
  const handleDpTimeEndDateChange = (date: string) => {
    setDpTimeSettings((prev: DateRange) => ({ ...prev, endDate: date }));
  };
  
  const handleDpTimeAddShift = () => {
    const startTime = '08:00';
    const endTime = '20:00';
    const isOvernight = startTime > endTime;
    
    const newShift: Shift = {
      id: Date.now().toString(),
      startTime,
      endTime,
      isOvernight
    };
    
    setDpTimeSettings((prev: DateRange) => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };
  
  const handleDpTimeUpdateShift = (id: string, field: keyof Shift, value: any) => {
    setDpTimeSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.map((shift: Shift) => 
        shift.id === id ? { ...shift, [field]: value } : shift
      )
    }));
  };
  
  const handleDpTimeDeleteShift = (id: string) => {
    setDpTimeSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.filter((shift: Shift) => shift.id !== id)
    }));
  };
  
  const handleDpTimeCalculate = () => {
    if (!data) {
      showSnackbar('No data available for calculation', 'warning');
      return;
    }
    
    const results = calculateOperationTimesByShifts(
      dpTimeOperations,
      dpTimeSettings.startDate,
      dpTimeSettings.endDate,
      dpTimeSettings.shifts
    );
    
    setDpTimeResults(results);
    setDpTimeResultsCalculated(true);
    
    if (results.length > 0) {
      showSnackbar('Calculation completed successfully', 'success');
      } else {
      showSnackbar('No results to display', 'warning');
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
        DP Hours
      </Typography>
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
          <Tab icon={<AccessTimeIcon />} label="DP Time" />
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
      
      {/* Content for "DP Time" tab */}
      {tabValue === 2 && (
        <Box sx={{ my: 2 }}>
          {/* Settings block */}
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <DPTimeSettings 
              settings={dpTimeSettings}
              loading={loading}
              error={error}
              onStartDateChange={handleDpTimeStartDateChange}
              onEndDateChange={handleDpTimeEndDateChange}
              onAddShift={handleDpTimeAddShift}
              onUpdateShift={handleDpTimeUpdateShift}
              onDeleteShift={handleDpTimeDeleteShift}
              onCalculate={handleDpTimeCalculate}
            />
                </Paper>
          
          {/* Results block - displayed only after calculation */}
          {dpTimeResultsCalculated && (
            <Paper sx={{ 
              p: 4, 
              mb: 3, 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <DPTimeResults 
                results={dpTimeResults}
                operations={dpTimeOperations}
                onBack={() => {}} // Empty function as we don't use back navigation
              />
        </Paper>
          )}
        </Box>
      )}
      
      {/* Dialog for complex adding multiple operations */}
      <ComplexAddDialog
        open={complexAdd?.open || false}
        loading={loading}
        complexAdd={complexAdd || { open: false, date: '', location: '', operations: [] }}
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
        onSave={handleSaveLocation}
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
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DPHoursPage; 