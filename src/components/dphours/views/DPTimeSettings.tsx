import React from 'react';
import { 
  Box, Paper, Typography, Button, TextField, 
  Grid, CircularProgress, Alert, useTheme, alpha
} from '@mui/material';
import { 
  WaterOutlined, 
  DirectionsBoatOutlined,
  AddCircleOutlineOutlined
} from '@mui/icons-material';
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
  const theme = useTheme();
  
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

  // Maritime theme styles
  const maritimeStyles = {
    dateRangeHeader: {
      display: 'flex',
      alignItems: 'center',
      mb: 1
    },
    icon: {
      color: theme.palette.primary.main,
      mr: 1
    },
    datePickerContainer: {
      '& .MuiOutlinedInput-root': {
        '&:hover fieldset': {
          borderColor: theme.palette.primary.light,
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        }
      }
    },
    calculateButton: {
      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
      boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
      }
    }
  };

  return (
    <Box>
      {/* Errors */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          icon={<WaterOutlined color="error" />}
        >
          {error}
        </Alert>
      )}
      
      {/* Date Range */}
      <Box sx={maritimeStyles.dateRangeHeader}>
        <DirectionsBoatOutlined sx={maritimeStyles.icon} />
        <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
          Date Range
        </Typography>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} sx={maritimeStyles.datePickerContainer}>
          <AppDatePicker
            label="Start Date"
            value={settings.startDate}
            onChange={(date) => onStartDateChange(date || '')}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} sx={maritimeStyles.datePickerContainer}>
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
          startIcon={loading ? undefined : <WaterOutlined />}
          sx={{ 
            ...maritimeStyles.calculateButton,
            minWidth: 150 
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Calculate'}
        </Button>
      </Box>
    </Box>
  );
};

export default DPTimeSettings; 