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
import { useTheme } from '../../providers/ThemeProvider';

// Константа для высоты полей ввода
const INPUT_HEIGHT = 56;
const INPUT_STYLES = {
  height: INPUT_HEIGHT,
  padding: '14px',
  boxSizing: 'border-box' as const
};

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
  const { isNightMode } = useTheme();
  
  // Используем операции в исходном порядке без сортировки
  const operations = complexAdd.operations;

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
              inputProps={{ style: { height: INPUT_HEIGHT } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Location"
              value={complexAdd.location || ''}
              onChange={(e) => onBaseChange('location', e.target.value)}
              fullWidth
              placeholder="Enter location"
              autoComplete="off"
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: INPUT_STYLES }}
              sx={{ 
                '& .MuiInputBase-root': {
                  height: INPUT_HEIGHT
                },
                '& input': {
                  height: '100%',
                  boxSizing: 'border-box'
                }
              }}
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
                  autoComplete="off"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ style: INPUT_STYLES }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      height: INPUT_HEIGHT
                    },
                    '& input': {
                      height: '100%',
                      boxSizing: 'border-box'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel shrink>Operation Type</InputLabel>
                  <Select
                    value={operation.operationType || ''}
                    onChange={(e) => onOperationChange(operation.id, 'operationType', e.target.value)}
                    label="Operation Type"
                    sx={{
                      height: INPUT_HEIGHT,
                      '& .MuiSelect-select': {
                        height: INPUT_HEIGHT,
                        display: 'flex', 
                        alignItems: 'center',
                        paddingTop: '0',
                        paddingBottom: '0'
                      }
                    }}
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
          sx={{
            color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading || !complexAdd.date || !complexAdd.location || complexAdd.operations.some(op => !op.time)}
          sx={{
            bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
            color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
            '&:hover': {
              bgcolor: isNightMode ? '#34495e' : 'primary.dark'
            }
          }}
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
  const { isNightMode } = useTheme();
  
  // Используем исходный порядок событий без сортировки
  const events = locationEditData?.events || [];
    
  // Check if any required fields are empty
  const hasEmptyFields = locationEditData?.events 
    ? locationEditData.events.some(op => !op.time || !op.operationType)
    : true;

  const handleDeleteOperation = (id: string) => {
    onDeleteSingleOperation(id);
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
      <DialogTitle>Edit Location</DialogTitle>
      <DialogContent dividers>
        {locationEditData && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <AppDatePicker
                  label="Date"
                  value={locationEditData.date}
                  onChange={(date) => onLocationDateChange(date || '')}
                  fullWidth
                  inputProps={{ style: { height: INPUT_HEIGHT } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  value={locationEditData.newLocation}
                  onChange={(e) => onLocationNameChange(e.target.value)}
                  fullWidth
                  autoComplete="off"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ style: INPUT_STYLES }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      height: INPUT_HEIGHT
                    },
                    '& input': {
                      height: '100%',
                      boxSizing: 'border-box'
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Operations ({events.length})
            </Typography>

            <List sx={{ mb: 2 }}>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 0
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Time"
                          type="time"
                          value={event.time}
                          onChange={(e) => onLocationOperationChange(index, 'time', e.target.value)}
                          fullWidth
                          autoComplete="off"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ style: INPUT_STYLES }}
                          sx={{ 
                            '& .MuiInputBase-root': {
                              height: INPUT_HEIGHT
                            },
                            '& input': {
                              height: '100%',
                              boxSizing: 'border-box'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel shrink>Operation Type</InputLabel>
                          <Select
                            value={event.operationType}
                            onChange={(e) => onLocationOperationChange(index, 'operationType', e.target.value)}
                            label="Operation Type"
                            sx={{
                              height: INPUT_HEIGHT,
                              '& .MuiSelect-select': {
                                height: INPUT_HEIGHT,
                                display: 'flex', 
                                alignItems: 'center',
                                paddingTop: '0',
                                paddingBottom: '0'
                              }
                            }}
                          >
                            {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOperation(event.id)}
                          disabled={events.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button 
                startIcon={<AddIcon />}
                onClick={onAddOperation}
                variant="outlined"
              >
                Add Operation
              </Button>
            </Box>
            
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
          sx={{
            color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={!locationEditData?.newLocation || !locationEditData?.date || loading || hasEmptyFields}
          sx={{ 
            ml: 1,
            bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
            color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
            '&:hover': {
              bgcolor: isNightMode ? '#34495e' : 'primary.dark'
            }
          }}
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
}) => {
  const { isNightMode } = useTheme();
  
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
        {editFormData && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <AppDatePicker
                label="Date"
                value={editFormData.date}
                onChange={(date) => onFormChange('date', date || '')}
                fullWidth
                inputProps={{ style: { height: INPUT_HEIGHT } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                value={editFormData.location}
                onChange={(e) => onFormChange('location', e.target.value)}
                fullWidth
                autoComplete="off"
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: INPUT_STYLES }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: INPUT_HEIGHT
                  },
                  '& input': {
                    height: '100%',
                    boxSizing: 'border-box'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Time"
                type="time"
                value={editFormData.time}
                onChange={(e) => onFormChange('time', e.target.value)}
                fullWidth
                autoComplete="off"
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: INPUT_STYLES }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: INPUT_HEIGHT
                  },
                  '& input': {
                    height: '100%',
                    boxSizing: 'border-box'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel shrink>Operation Type</InputLabel>
                <Select
                  value={editFormData.operationType}
                  onChange={(e) => onFormChange('operationType', e.target.value)}
                  label="Operation Type"
                  sx={{
                    height: INPUT_HEIGHT,
                    '& .MuiSelect-select': {
                      height: INPUT_HEIGHT,
                      display: 'flex', 
                      alignItems: 'center',
                      paddingTop: '0',
                      paddingBottom: '0'
                    }
                  }}
                >
                  {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ position: 'relative', px: 3, py: 2 }}>
        <Button 
          onClick={onDelete} 
          color="error" 
          startIcon={<DeleteForeverIcon />}
          sx={{ 
            position: 'absolute', 
            left: 16,
            color: isNightMode ? '#f5526b' : undefined
          }}
        >
          Delete
        </Button>
        <Box sx={{ ml: 'auto' }}>
          <Button 
            onClick={onClose}
            sx={{
              color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : undefined
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave} 
            variant="contained" 
            disabled={!editFormData?.location || !editFormData?.time || !editFormData?.operationType || loading}
            sx={{ 
              ml: 1,
              bgcolor: isNightMode ? '#2c3e50' : 'primary.main',
              color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
              '&:hover': {
                bgcolor: isNightMode ? '#34495e' : 'primary.dark'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}; 