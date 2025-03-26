import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DPHours, operationColors } from '../types';

interface LocationCardProps {
  location: string;
  events: DPHours[];
  onEdit: () => void;
  onDelete: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  events,
  onEdit,
  onDelete
}) => {
  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box sx={{ 
        p: 1.5, 
        bgcolor: 'primary.light', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {location}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">
            {events.length} operations
          </Typography>
          <IconButton 
            size="small"
            onClick={onEdit}
            sx={{ color: 'white', ml: 1, mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            onClick={onDelete}
            sx={{ color: 'white' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <List sx={{ width: '100%' }}>
        {events.map((event, index) => (
          <React.Fragment key={event.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              sx={{ 
                py: 1.5,
                borderLeft: `4px solid ${operationColors[event.operationType]}`,
                pl: 3
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" component="span" fontWeight="bold" sx={{ mr: 2 }}>
                      {event.time}
                    </Typography>
                    <Chip 
                      label={event.operationType}
                      size="small"
                      sx={{ 
                        backgroundColor: operationColors[event.operationType],
                        color: 'white'
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default LocationCard; 