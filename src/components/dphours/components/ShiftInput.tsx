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
      boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
      }
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      mb: 2
    },
    headerIcon: {
      color: theme.palette.primary.main,
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
      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`
    },
    timeField: {
      '& .MuiOutlinedInput-root': {
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 3px 5px ${alpha(theme.palette.primary.main, 0.2)}`
        },
        '&:hover fieldset': {
          borderColor: theme.palette.primary.light,
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        }
      }
    },
    shiftType: {
      ml: 1, 
      fontStyle: 'italic',
      fontSize: '0.85rem',
      border: '1px solid',
      borderColor: theme.palette.primary.light,
      borderRadius: '16px',
      padding: '2px 10px',
      color: theme.palette.primary.main,
      background: alpha(theme.palette.primary.light, 0.1)
    },
    addButton: {
      mt: 1,
      background: alpha(theme.palette.primary.main, 0.05),
      borderColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
      transition: 'all 0.3s ease',
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.1),
        transform: 'translateY(-2px)',
        boxShadow: `0 3px 5px ${alpha(theme.palette.primary.main, 0.2)}`
      }
    },
    deleteIcon: {
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'rotate(90deg)',
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
            sx={{ ...maritimeStyles.timeField, width: 140, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="Shift End"
            value={shift.endTime}
            onChange={(e) => handleTimeChange(shift.id, 'endTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            sx={{ ...maritimeStyles.timeField, width: 140, mr: 2 }}
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