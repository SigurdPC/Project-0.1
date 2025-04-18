import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../../providers/ThemeProvider';

// Props для ComplexAddDialog
interface ComplexAddDialogProps {
  open: boolean;
  loading: boolean;
  complexAdd: ComplexAddState;
  onClose: () => void;
  onSave: () => Promise<boolean>;
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
  onSave: () => Promise<boolean>;
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
  onSave: () => Promise<boolean>;
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
  const { isNightMode } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  // Используем операции в исходном порядке без сортировки
  const operations = complexAdd.operations;

  // Обработчик сохранения с обработкой ответа
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave();
      // Если успешно, диалог закроется внутри onSave
      setIsSaving(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '8px',
        }
      }}
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
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: isNightMode ? 'rgba(42, 42, 42, 0.5)' : 'inherit',
            borderColor: isNightMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
          }}
        >
          {operations.map((operation, index) => (
            <Grid 
              container 
              spacing={2} 
              key={operation.id}
              sx={{ 
                mb: 2,
                pb: index < operations.length - 1 ? 2 : 0,
                borderBottom: index < operations.length - 1 
                  ? `1px dashed ${isNightMode ? 'rgba(255, 255, 255, 0.12)' : '#ccc'}`
                  : 'none'
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
              sx={{
                color: isNightMode ? 'rgba(255, 255, 255, 0.8)' : undefined,
                borderColor: isNightMode ? 'rgba(255, 255, 255, 0.3)' : undefined,
                '&:hover': {
                  backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
                  borderColor: isNightMode ? 'rgba(255, 255, 255, 0.5)' : undefined
                }
              }}
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
        <Button 
          onClick={onClose}
          disabled={isSaving || loading}
          sx={{
            color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={isSaving || loading || !complexAdd.date || !complexAdd.location || complexAdd.operations.some(op => !op.time)}
          sx={{
            bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
            color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
            '&:hover': {
              bgcolor: isNightMode ? '#34495e' : 'primary.dark'
            }
          }}
        >
          {isSaving || loading ? <CircularProgress size={24} /> : 'Save All'}
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
  const { isNightMode } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  // Отслеживаем изменения locationEditData для обнаружения удаления операций
  useEffect(() => {
    console.log('locationEditData updated in dialog:', 
      locationEditData?.events?.length || 0, 'operations');
  }, [locationEditData]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave();
      // Если успешно, диалог закроется внутри onSave
      setIsSaving(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setIsSaving(false);
    }
  };

  // Используем исходный порядок событий без сортировки
  const events = locationEditData?.events || [];
    
  // Проверяем наличие незаполненных полей
  const hasEmptyFields = events.some(event => !event.time || !event.operationType);
  
  // Проверяем, можно ли удалить операцию
  const canDeleteOperation = (event: DPHours) => {
    // Если всего две операции, запрещаем удаление
    if (events.length <= 2) {
      return false;
    }
    
    // Подсчитываем количество DP Setup и DP OFF
    const setupCount = events.filter(e => e.operationType === 'DP Setup').length;
    const offCount = events.filter(e => e.operationType === 'DP OFF').length;
    
    // Если это последний DP Setup или DP OFF, запрещаем удаление
    if (event.operationType === 'DP Setup' && setupCount <= 1) {
      return false;
    }
    
    if (event.operationType === 'DP OFF' && offCount <= 1) {
      return false;
    }
    
    return true;
  };

  // Безопасный обработчик удаления с дополнительной проверкой
  const handleDeleteOperation = (id: string) => {
    console.log(`EditLocationDialog: Deleting operation ${id}`);
    onDeleteSingleOperation(id);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
        }
      }}
    >
      <DialogTitle>Edit Location Operations</DialogTitle>
      <DialogContent dividers>
        {locationEditData && (
          <>
            <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
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
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 3,
                bgcolor: isNightMode ? 'rgba(42, 42, 42, 0.5)' : 'inherit',
                borderColor: isNightMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
              }}
            >
              {events.map((event, index) => (
                <Grid 
                  container 
                  spacing={2} 
                  key={event.id}
                  sx={{ 
                    mb: 2,
                    pb: 2,
                    borderBottom: index < events.length - 1 
                      ? `1px dashed ${isNightMode ? 'rgba(255, 255, 255, 0.12)' : '#ccc'}`
                      : 'none'
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
                      onClick={() => handleDeleteOperation(event.id)}
                      disabled={loading || !canDeleteOperation(event)}
                      title={!canDeleteOperation(event) ? 
                        "Cannot delete required operations (DP Setup and DP OFF are mandatory)" : 
                        "Delete operation"}
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
                  sx={{
                    color: isNightMode ? 'rgba(255, 255, 255, 0.8)' : undefined,
                    borderColor: isNightMode ? 'rgba(255, 255, 255, 0.3)' : undefined,
                    '&:hover': {
                      backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
                      borderColor: isNightMode ? 'rgba(255, 255, 255, 0.5)' : undefined
                    }
                  }}
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
        <Button 
          onClick={onClose}
          disabled={isSaving || loading}
          sx={{
            color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={!locationEditData?.newLocation || !locationEditData?.date || isSaving || loading || hasEmptyFields}
          sx={{ 
            ml: 1,
            bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
            color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
            '&:hover': {
              bgcolor: isNightMode ? '#34495e' : 'primary.dark'
            }
          }}
        >
          {isSaving || loading ? <CircularProgress size={24} /> : 'Save'}
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
}) => {
  const { isNightMode } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave();
      // Если успешно, диалог закроется внутри onSave
      setIsSaving(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
        }
      }}
    >
      <DialogTitle>Edit Operation</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
      <DialogActions sx={{ position: 'relative', px: 3, py: 2 }}>
        <Button 
          onClick={onDelete} 
          color="error" 
          disabled={isSaving || loading || !editFormData?.id}
          startIcon={<DeleteForeverIcon />}
          sx={{ marginRight: 'auto' }}
        >
          Delete
        </Button>
        <Box sx={{ ml: 'auto' }}>
          <Button 
            onClick={onClose}
            disabled={isSaving || loading}
            sx={{
              color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!editFormData?.location || !editFormData?.time || !editFormData?.operationType || isSaving || loading}
            sx={{ 
              ml: 1,
              bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
              color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
              '&:hover': {
                bgcolor: isNightMode ? '#34495e' : 'primary.dark'
              }
            }}
          >
            {isSaving || loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}; 