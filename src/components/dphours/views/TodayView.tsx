import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Timeline from '../Timeline';
import { DPHours } from '../types';
import { formatDate } from '../utils';

interface TodayViewProps {
  eventsForSelectedDate: DPHours[];
  selectedDate: string;
  onOpenComplexAdd: () => void;
  onEdit: (id: string, updatedData: DPHours) => void;
  onEditLocation: (date: string, location: string, events: DPHours[]) => void;
  onDeleteLocation: (id: string) => void;
}

const TodayView: React.FC<TodayViewProps> = ({
  eventsForSelectedDate,
  selectedDate,
  onOpenComplexAdd,
  onEdit,
  onEditLocation,
  onDeleteLocation
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Events for Today ({formatDate(selectedDate)})
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={onOpenComplexAdd}
        >
          Add Event
        </Button>
      </Box>
      
      {eventsForSelectedDate.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          No events for today
        </Typography>
      ) : (
        <Timeline 
          events={eventsForSelectedDate} 
          onEdit={onEdit}
          onEditLocation={onEditLocation}  
          onDelete={onDeleteLocation}
        />
      )}
    </Paper>
  );
};

export default TodayView; 