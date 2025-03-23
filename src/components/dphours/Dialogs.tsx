import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Typography, Box, Paper, List,
  ListItem, Chip, Divider, IconButton, CircularProgress
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

// Props для StatsDialog
interface StatsDialogProps {
  open: boolean;
  dateRange: {
    start: string;
    end: string;
    startTime: string;
    endTime: string;
    useTimeFilter: boolean;
  };
  dpSessions: DPSession[];
  onClose: () => void;
  onDateRangeChange: (field: string, value: string) => void;
  onToggleTimeFilter: () => void;
  onUpdateStats: () => void;
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
  onDeleteAllOperations: () => void;
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

// Компонент диалога статистики
export const StatsDialog: React.FC<StatsDialogProps> = ({
  open,
  dateRange,
  dpSessions,
  onClose,
  onDateRangeChange,
  onToggleTimeFilter,
  onUpdateStats
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>DP Time Statistics</DialogTitle>
    <DialogContent>
      {/* Date Range Selection */}
      <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
        <Grid item xs={12} sm={5}>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange('start', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder: "дд.мм.гггг"
            }}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange('end', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              placeholder: "дд.мм.гггг"
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button 
            variant="contained" 
            onClick={onUpdateStats}
            fullWidth
            sx={{ height: '56px' }}
          >
            Update
          </Button>
        </Grid>
      </Grid>
      
      {/* Shift Filter Controls */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip
            label={dateRange.useTimeFilter ? "Shift Filter: ON" : "Shift Filter: OFF"}
            color={dateRange.useTimeFilter ? "primary" : "default"}
            onClick={onToggleTimeFilter}
            sx={{ cursor: 'pointer', mr: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {dateRange.useTimeFilter 
              ? "Filtering events by shift time" 
              : "Click to enable shift time filtering"}
          </Typography>
        </Box>
        
        {dateRange.useTimeFilter && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Shift Start Time:</Typography>
                  <TextField
                    type="time"
                    value={dateRange.startTime}
                    onChange={(e) => onDateRangeChange('startTime', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Shift End Time:</Typography>
                  <TextField
                    type="time"
                    value={dateRange.endTime}
                    onChange={(e) => onDateRangeChange('endTime', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        Total Working Time: {formatDuration(dpSessions.reduce((sum, session) => sum + session.duration, 0))}
        {dateRange.useTimeFilter && (
          <Chip 
            label={`Shift: ${dateRange.startTime} - ${dateRange.endTime}`}
            size="small"
            color="primary"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>
      
      {dpSessions.length > 0 ? (
        <List>
          {dpSessions.map((session, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem sx={{ py: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">Start:</Typography>
                    <Typography variant="body1">
                      {formatDate(session.startDate)} {session.startTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">End:</Typography>
                    <Typography variant="body1">
                      {session.endDate 
                        ? `${formatDate(session.endDate)} ${session.endTime}` 
                        : (session.duration > 0 
                          ? `End of shift (estimate)` 
                          : "Not completed")
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">Location:</Typography>
                    <Typography variant="body1">{session.location}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">Duration:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {session.endDate 
                        ? formatDuration(session.duration) 
                        : (session.duration > 0 
                          ? `${formatDuration(session.duration)} (est.)` 
                          : "In progress")
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          No data for selected period
        </Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
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
  onDeleteAllOperations
}) => (
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
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="New Location"
            value={locationEditData?.newLocation || ''}
            onChange={(e) => onLocationNameChange(e.target.value)}
            fullWidth
            placeholder="Enter location"
          />
        </Grid>
      </Grid>

      {locationEditData && locationEditData.events.length > 0 && (
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
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <FormControl fullWidth>
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
        onClick={onDeleteAllOperations} 
        color="error" 
        startIcon={<DeleteForeverIcon />}
        sx={{ position: 'absolute', left: 16 }}
      >
        Delete All
      </Button>
      <Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary"
          disabled={!locationEditData?.newLocation || loading}
          sx={{ ml: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </DialogActions>
  </Dialog>
);

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