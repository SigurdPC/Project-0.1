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
}) => (
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
          <TextField
            label="Date"
            type="date"
            value={complexAdd.date || ''}
            onChange={(e) => onBaseChange('date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder: "дд.мм.гггг"
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location"
            value={complexAdd.location || ''}
            onChange={(e) => onBaseChange('location', e.target.value)}
            fullWidth
            placeholder="Enter location"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        Operations
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {complexAdd.operations.map((operation, index) => (
          <Grid 
            container 
            spacing={2} 
            key={operation.id}
            sx={{ 
              mb: 2,
              pb: index < complexAdd.operations.length - 1 ? 2 : 0,
              borderBottom: index < complexAdd.operations.length - 1 ? '1px dashed #ccc' : 'none'
            }}
          >
            <Grid item xs={12} sm={4}>
              <TextField
                label="Time"
                type="time"
                value={operation.time || ''}
                onChange={(e) => onOperationChange(operation.id, 'time', e.target.value)}
                fullWidth
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
                >
                  {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <IconButton 
                color="error"
                onClick={() => onRemoveOperation(operation.id)}
                disabled={complexAdd.operations.length <= 1}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
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
  // Проверяем, есть ли пустые поля в операциях
  const hasEmptyFields = locationEditData?.events.some(
    event => !event.time || !event.operationType
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Edit Location</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Date"
              type="date"
              value={locationEditData?.date || ''}
              onChange={(e) => onLocationDateChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{
                placeholder: "дд.мм.гггг"
              }}
              required
              error={!locationEditData?.date}
              helperText={!locationEditData?.date ? "Дата обязательна" : ""}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="New Location"
              value={locationEditData?.newLocation || ''}
              onChange={(e) => onLocationNameChange(e.target.value)}
              fullWidth
              placeholder="Enter location"
              required
              error={!locationEditData?.newLocation}
              helperText={!locationEditData?.newLocation ? "Название локации обязательно" : ""}
            />
          </Grid>
        </Grid>

        {locationEditData && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Operations
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              {locationEditData.events.map((event, index) => (
                <Grid 
                  container 
                  spacing={2} 
                  key={event.id}
                  sx={{ 
                    mb: 2,
                    pb: 2,
                    borderBottom: index < locationEditData.events.length - 1 ? '1px dashed #ccc' : 'none'
                  }}
                >
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Time"
                      type="time"
                      value={event.time || ''}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => onLocationOperationChange(index, 'time', e.target.value)}
                      required
                      error={!event.time}
                      helperText={!event.time ? "Время обязательно" : ""}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <FormControl fullWidth required error={!event.operationType}>
                      <InputLabel>Operation Type</InputLabel>
                      <Select
                        value={event.operationType || ''}
                        label="Operation Type"
                        onChange={(e) => onLocationOperationChange(index, 'operationType', e.target.value as OperationType)}
                      >
                        {(['DP Setup', 'Moving in', 'Handling Offshore', 'Pulling Out', 'DP OFF'] as OperationType[]).map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                      {!event.operationType && (
                        <Typography variant="caption" color="error">
                          Тип операции обязателен
                        </Typography>
                      )}
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
        <Grid item xs={12} md={6}>
          <TextField
            label="Date"
            type="date"
            value={editFormData?.date || ''}
            onChange={(e) => onFormChange('date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder: "дд.мм.гггг"
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Time"
            type="time"
            value={editFormData?.time || ''}
            onChange={(e) => onFormChange('time', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Location"
            value={editFormData?.location || ''}
            onChange={(e) => onFormChange('location', e.target.value)}
            fullWidth
            placeholder="Enter location"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Operation Type</InputLabel>
            <Select
              value={editFormData?.operationType || ''}
              label="Operation Type"
              onChange={(e) => onFormChange('operationType', e.target.value as OperationType)}
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