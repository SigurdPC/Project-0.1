import React from 'react';
import { 
  Box, Paper, Typography, Button, TextField, 
  Grid, CircularProgress, Alert
} from '@mui/material';
import { Shift, TimeCalculationSettings } from '../types';
import ShiftInput from '../components/ShiftInput';
import AppDatePicker from '../../common/AppDatePicker';

interface DPTimeSettingsProps {
  settings: TimeCalculationSettings;
  loading: boolean;
  error: string | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAddShift: () => void;
  onUpdateShift: (id: string, field: keyof Shift, value: any) => void;
  onDeleteShift: (id: string) => void;
  onCalculate: () => void;
}

const DPTimeSettings: React.FC<DPTimeSettingsProps> = ({
  settings,
  loading,
  error,
  onStartDateChange,
  onEndDateChange,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onCalculate
}) => {
  // Validation check before calculation
  const isValid = (): boolean => {
    if (!settings.startDate || !settings.endDate) {
      return false;
    }
    
    // Check that end date is not earlier than start date
    if (settings.startDate > settings.endDate) {
      return false;
    }
    
    // Check that all shifts have start and end times
    return settings.shifts.every(shift => 
      shift.startTime && 
      shift.endTime && 
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.startTime) && 
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.endTime)
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Calculation Settings
      </Typography>
      
      {/* Errors */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Date Range */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Date Range
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <AppDatePicker
            label="Start Date"
            value={settings.startDate}
            onChange={(date) => onStartDateChange(date || '')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <AppDatePicker
            label="End Date"
            value={settings.endDate}
            onChange={(date) => onEndDateChange(date || '')}
            fullWidth
          />
        </Grid>
      </Grid>
      
      {/* Shift Settings */}
      <ShiftInput
        shifts={settings.shifts}
        onAddShift={onAddShift}
        onUpdateShift={onUpdateShift}
        onDeleteShift={onDeleteShift}
      />
      
      {/* Calculate Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={loading || !isValid()}
          onClick={onCalculate}
          size="large"
          sx={{ minWidth: 150 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Calculate'}
        </Button>
      </Box>
    </Paper>
  );
};

export default DPTimeSettings; 