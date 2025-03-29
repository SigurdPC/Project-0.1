import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Typography, Box, Paper, List,
  ListItem, Divider, IconButton, CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { DPHours, OperationType, DPSession, ComplexAddState, LocationEditData } from './types';
import { formatDate, formatDuration } from './utils';
import AppDatePicker from '../common/AppDatePicker';

// Props для ComplexAddDialog
interface ComplexAddDialogProps {
  open: boolean;
  loading: boolean;
  complexAdd: ComplexAddState;
  onClose: () => void;
  onSave: () => void;
  onBaseChange: (field: 'date' | 'location', value: string) => void;
  onAddOperation: () => void;
  onOperationChange: (id: string, field: 'time' | 'operationType', value: string) => void;
  onRemoveOperation: (id: string) => void;
}

// Props для EditLocationDialog
interface EditLocationDialogProps {
  open: boolean;
  loading: boolean;
  locationEditData: LocationEditData | null;
  onClose: () => void;
  onSave: () => void;
  onLocationDateChange: (value: string) => void;
  onLocationNameChange: (value: string) => void;
  onLocationOperationChange: (index: number, field: keyof DPHours, value: any) => void;
  onDeleteSingleOperation: (id: string) => void;
  onAddOperation: () => void;
}

// Props для EditOperationDialog
interface EditOperationDialogProps {
  open: boolean;
  loading: boolean;
  editFormData: DPHours | null;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: keyof DPHours, value: any) => void;
  onDelete: () => void;
}

// Компонент диалога комплексного добавления
export const ComplexAddDialog: React.FC<ComplexAddDialogProps> = ({
  open,
  loading,
  complexAdd,
  onClose,
  onSave,
  onBaseChange,
  onAddOperation,
  onOperationChange,
  onRemoveOperation
}) => {
  // Сортировка операций - новые операции с пустым временем должны быть в конце списка
  const sortedOperations = [...complexAdd.operations].sort((a, b) => {
    // Если обе операции имеют время, сортируем по времени
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    // Операции с пустым временем всегда в конце списка
    if (!a.time) return 1;
    if (!b.time) return -1;
    return 0;
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Add Operations</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <AppDatePicker
              label="Date"
              value={complexAdd.date || null}
              onChange={(date) => onBaseChange('date', date || '')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Location"
              value={complexAdd.location || ''}
              onChange={(e) => onBaseChange('location', e.target.value)}
              fullWidth
              size="small"
              placeholder="Enter location"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          Operations
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          {sortedOperations.map((operation, index) => (
            <Grid 
              container 
              spacing={2} 
              key={operation.id}
              sx={{ 
                mb: 2,
                pb: index < sortedOperations.length - 1 ? 2 : 0,
                borderBottom: index < sortedOperations.length - 1 ? '1px dashed #ccc' : 'none'
              }}
            >
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Time"
                  type="time"
                  value={operation.time || ''}
                  onChange={(e) => onOperationChange(operation.id, 'time', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Operation Type</InputLabel>
                  <Select
                    value={operation.operationType || ''}
                    onChange={(e) => onOperationChange(operation.id, 'operationType', e.target.value)}
                    label="Operation Type"
                    size="small"
                  >
                    {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton 
                  size="small"
                  color="error"
                  onClick={() => onRemoveOperation(operation.id)}
                  disabled={complexAdd.operations.length <= 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              startIcon={<AddIcon />}
              onClick={onAddOperation}
              variant="outlined"
            >
              Add Operation
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {complexAdd.operations.length} operations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {complexAdd.date && formatDate(complexAdd.date)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary" 
          disabled={loading || !complexAdd.date || !complexAdd.location || complexAdd.operations.some(op => !op.time)}
        >
          {loading ? <CircularProgress size={24} /> : 'Save All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент диалога редактирования локации
export const EditLocationDialog: React.FC<EditLocationDialogProps> = ({
  open,
  loading,
  locationEditData,
  onClose,
  onSave,
  onLocationDateChange,
  onLocationNameChange,
  onLocationOperationChange,
  onDeleteSingleOperation,
  onAddOperation
}) => {
  // Сортировка событий - операции с пустым временем располагаются в конце
  const sortedEvents = locationEditData?.events 
    ? [...locationEditData.events].sort((a, b) => {
        // Если обе операции имеют время, сортируем по времени
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        // Операции с пустым временем всегда в конце списка
        if (!a.time) return 1;
        if (!b.time) return -1;
        return 0;
      })
    : [];
    
  // Check if any required fields are empty
  const hasEmptyFields = locationEditData?.events 
    ? locationEditData.events.some(event => !event.time || !event.operationType) 
    : false;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Edit Location</DialogTitle>
      <DialogContent>
        {locationEditData && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <AppDatePicker
                  label="Date"
                  value={locationEditData.date || null}
                  onChange={(date) => onLocationDateChange(date || '')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  value={locationEditData.newLocation || ''}
                  onChange={(e) => onLocationNameChange(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter location"
                  required
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Operations
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              {sortedEvents.map((event, index) => (
                <Grid 
                  container 
                  spacing={2} 
                  key={event.id}
                  sx={{ 
                    mb: 2,
                    pb: 2,
                    borderBottom: index < sortedEvents.length - 1 ? '1px dashed #ccc' : 'none'
                  }}
                >
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Time"
                      type="time"
                      value={event.time || ''}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => onLocationOperationChange(index, 'time', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <FormControl fullWidth>
                      <InputLabel>Operation Type</InputLabel>
                      <Select
                        value={event.operationType}
                        label="Operation Type"
                        onChange={(e) => onLocationOperationChange(index, 'operationType', e.target.value as OperationType)}
                        size="small"
                      >
                        {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteSingleOperation(event.id)}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={onAddOperation}
                >
                  Add Operation
                </Button>
              </Box>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total: {locationEditData.events.length} operations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {locationEditData.date && formatDate(locationEditData.date)}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary"
          disabled={!locationEditData?.newLocation || !locationEditData?.date || loading || hasEmptyFields}
          sx={{ ml: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент диалога редактирования операции
export const EditOperationDialog: React.FC<EditOperationDialogProps> = ({
  open,
  loading,
  editFormData,
  onClose,
  onSave,
  onFormChange,
  onDelete
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>Edit Operation</DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6}>
          <AppDatePicker
            label="Date"
            value={editFormData?.date || null}
            onChange={(date) => onFormChange('date', date || '')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Time"
            type="time"
            value={editFormData?.time || ''}
            onChange={(e) => onFormChange('time', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location"
            value={editFormData?.location || ''}
            onChange={(e) => onFormChange('location', e.target.value)}
            fullWidth
            size="small"
            placeholder="Enter location"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Operation Type</InputLabel>
            <Select
              value={editFormData?.operationType || ''}
              label="Operation Type"
              onChange={(e) => onFormChange('operationType', e.target.value as OperationType)}
              size="small"
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
      <Button 
        onClick={onDelete} 
        color="error" 
        startIcon={<DeleteForeverIcon />}
        sx={{ position: 'absolute', left: 16 }}
      >
        Delete
      </Button>
      <Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary"
          disabled={!editFormData?.location || !editFormData?.time || !editFormData?.operationType || loading}
          sx={{ ml: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </DialogActions>
  </Dialog>
); 