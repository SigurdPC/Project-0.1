import React from 'react';
import { 
  Box, IconButton, Typography, Button, Paper, TextField
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
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

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Work Shifts
      </Typography>
      
      {shifts.map((shift, index) => (
        <Box 
          key={shift.id} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2, 
            pb: 2,
            borderBottom: index < shifts.length - 1 ? '1px solid #eee' : 'none' 
          }}
        >
          <TextField
            label="Shift Start"
            value={shift.startTime}
            onChange={(e) => handleTimeChange(shift.id, 'startTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            sx={{ width: 140, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="Shift End"
            value={shift.endTime}
            onChange={(e) => handleTimeChange(shift.id, 'endTime', e.target.value)}
            placeholder="HH:MM"
            size="small"
            type="time"
            sx={{ width: 140, mr: 2 }}
            inputProps={{ step: 300 }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ ml: 1, fontStyle: 'italic' }}
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
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Button 
        variant="outlined" 
        onClick={onAddShift}
        sx={{ mt: 1 }}
      >
        Add Shift
      </Button>
    </Paper>
  );
};

export default ShiftInput; 