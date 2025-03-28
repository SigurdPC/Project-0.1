import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
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
    <Paper sx={{ p: 4, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          onClick={onOpenComplexAdd}
          sx={{ 
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 500,
            py: 1
          }}
        >
          ADD NEW
        </Button>
        
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {formatDate(selectedDate)}
        </Typography>
      </Box>
      
      {eventsForSelectedDate.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 6, fontSize: '1.1rem' }}>
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