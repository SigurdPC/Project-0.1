import React from 'react';
import { 
  Box, IconButton, Typography, Button, Paper, TextField, useTheme, alpha, SxProps, Theme
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  WatchLater as WatchLaterIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  WbTwilight as WbTwilightIcon
} from '@mui/icons-material';
import { Shift } from '../types';
import { useTheme as useCustomTheme } from '../../../providers/ThemeProvider';

interface ShiftInputProps {
  shifts: Shift[];
  onAddShift: () => void;
  onUpdateShift: (id: string, field: keyof Shift, value: any) => void;
  onDeleteShift: (id: string) => void;
}

const ShiftInput: React.FC<ShiftInputProps> = ({ 
  shifts, onAddShift, onUpdateShift, onDeleteShift 
}) => {
  const theme = useTheme();
  const { isNightMode } = useCustomTheme();
  
  // Handler for time change in a shift
  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    // Check if the entered time is valid
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
      onUpdateShift(id, field, value);
      
      // Automatic determination of shift type (night or day)
      const shift = shifts.find(s => s.id === id);
      if (shift) {
        // Get updated time values
        const startTime = field === 'startTime' ? value : shift.startTime;
        const endTime = field === 'endTime' ? value : shift.endTime;
        
        // If both times are valid, determine the shift type
        if (startTime && endTime && 
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime) && 
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
          // If start time is greater than end time, it's a night shift
          const isOvernight = startTime > endTime;
          onUpdateShift(id, 'isOvernight', isOvernight);
        }
      }
    }
  };

  // Function to format shift type
  const getShiftTypeText = (shift: Shift) => {
    if (!shift.startTime || !shift.endTime) return '';
    return shift.isOvernight ? '(Night Shift)' : '(Day Shift)';
  };

  // Maritime theme styles
  const maritimeStyles = {
    paper: {
      position: 'relative',
      overflow: 'hidden',
      p: 2, 
      mb: 2,
      borderRadius: '8px',
      boxShadow: isNightMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      bgcolor: isNightMode ? '#1e1e1e' : theme.palette.background.paper,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      mb: 2
    },
    headerIcon: {
      color: isNightMode ? '#90caf9' : theme.palette.primary.main,
      mr: 1
    },
    shiftRow: {
      display: 'flex', 
      alignItems: 'center', 
      mb: 2, 
      pb: 2,
      position: 'relative'
    },
    shiftDivider: {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '10%',
      right: '10%',
      height: '1px',
      background: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    },
    timeField: {
      '& .MuiOutlinedInput-root': {
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: isNightMode ? 'rgba(255,255,255,0.3)' : theme.palette.primary.light
        },
        '&:hover fieldset': {
          borderColor: isNightMode ? 'rgba(255,255,255,0.3)' : theme.palette.primary.light,
        },
        '&.Mui-focused fieldset': {
          borderColor: isNightMode ? '#90caf9' : theme.palette.primary.main,
          borderWidth: 2,
        }
      }
    },
    shiftType: {
      ml: 1, 
      fontStyle: 'italic',
      fontSize: '0.85rem',
      border: '1px solid',
      borderColor: isNightMode ? 'rgba(144, 202, 249, 0.5)' : theme.palette.primary.light,
      borderRadius: '16px',
      padding: '2px 10px',
      color: isNightMode ? '#90caf9' : theme.palette.primary.main,
      background: isNightMode ? 'rgba(144, 202, 249, 0.1)' : alpha(theme.palette.primary.light, 0.1)
    },
    addButton: {
      mt: 1,
      background: isNightMode ? 'rgba(144, 202, 249, 0.05)' : alpha(theme.palette.primary.main, 0.05),
      borderColor: isNightMode ? 'rgba(144, 202, 249, 0.5)' : theme.palette.primary.light,
      color: isNightMode ? '#90caf9' : theme.palette.primary.main,
      transition: 'all 0.3s ease',
      '&:hover': {
        background: isNightMode ? 'rgba(144, 202, 249, 0.15)' : alpha(theme.palette.primary.main, 0.1)
      }
    },
    deleteIcon: {
      transition: 'all 0.2s ease',
      '&:hover': {
        color: theme.palette.error.dark
      }
    }
  };

  return (
    <Paper sx={maritimeStyles.paper}>
      <Box sx={maritimeStyles.header}>
        <WbTwilightIcon sx={{ ...maritimeStyles.headerIcon, fontSize: '1.8rem' }} />
        <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
          Shifts
        </Typography>
      </Box>
      
      {shifts.map((shift, index) => (
        <Box key={shift.id} sx={maritimeStyles.shiftRow}>
          <WatchLaterIcon 
            fontSize="small" 
            color="primary" 
            sx={{ mr: 1, opacity: 0.8 }} 
          />
          <TextField
            label="Shift Start"
            value={shift.startTime}
            onChange={(e) => handleTimeChange(shift.id, 'startTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            autoComplete="off"
            sx={{ ...maritimeStyles.timeField, width: 200, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="Shift End"
            value={shift.endTime}
            onChange={(e) => handleTimeChange(shift.id, 'endTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            autoComplete="off"
            sx={{ ...maritimeStyles.timeField, width: 200, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={maritimeStyles.shiftType}
          >
            {getShiftTypeText(shift)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {shifts.length > 1 && (
            <IconButton 
              onClick={() => onDeleteShift(shift.id)}
              size="small"
              color="error"
              aria-label="delete shift"
              sx={maritimeStyles.deleteIcon}
            >
              <DeleteIcon />
            </IconButton>
          )}
          
          {/* Add divider for all but the last row */}
          {index < shifts.length - 1 && (
            <Box sx={maritimeStyles.shiftDivider} />
          )}
        </Box>
      ))}
      
      <Button 
        variant="outlined" 
        onClick={onAddShift}
        startIcon={<AddCircleOutlineIcon />}
        sx={maritimeStyles.addButton}
      >
        Add Shift
      </Button>
    </Paper>
  );
};

export default ShiftInput; 