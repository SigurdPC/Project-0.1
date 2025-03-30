import React from 'react';
import { List, ListItem, ListItemText, IconButton, Tooltip, Box, Paper, Typography, Divider } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { formatTime } from '../../../utils/dateUtils';

// Operation types
export type OperationType = 'DP Setup' | 'Moving in' | 'Handling Offshore' | 'Pulling Out' | 'DP OFF';

// Interface for events
export interface DPHours {
  id: string;
  date: string;
  time: string;
  location: string;
  operationType: OperationType;
}

interface TimelineProps {
  events: DPHours[];
  onEditEvent?: (event: DPHours) => void;
  onDeleteEvent?: (id: string) => void;
  grouped?: boolean;
  showDate?: boolean;
}

// Returns color for operation type
const getOperationColor = (operationType: OperationType): string => {
  switch (operationType) {
    case 'DP Setup':
      return '#4caf50'; // Green
    case 'Moving in':
      return '#2196f3'; // Blue
    case 'Handling Offshore':
      return '#ff9800'; // Orange
    case 'Pulling Out':
      return '#9c27b0'; // Purple
    case 'DP OFF':
      return '#f44336'; // Red
    default:
      return '#2196f3'; // Default blue
  }
};

// Groups events by location
const groupEventsByLocation = (events: DPHours[]): Record<string, DPHours[]> => {
  const grouped: Record<string, DPHours[]> = {};
  
  events.forEach(event => {
    if (!grouped[event.location]) {
      grouped[event.location] = [];
    }
    grouped[event.location].push(event);
  });
  
  return grouped;
};

const Timeline: React.FC<TimelineProps> = ({ 
  events, 
  onEditEvent = () => {}, 
  onDeleteEvent = () => {},
  grouped = false,
  showDate = false
}) => {
  // If no events, show message
  if (events.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No events to display
        </Typography>
      </Paper>
    );
  }
  
  // If grouping is enabled, group by locations
  if (grouped) {
    const groupedEvents = groupEventsByLocation(events);
    
    return (
      <Box>
        {Object.entries(groupedEvents).map(([location, locationEvents]) => (
          <Paper key={location} sx={{ mb: 2, overflow: 'hidden' }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1">{location}</Typography>
              <Typography variant="caption">
                {locationEvents.length} operation{locationEvents.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <List dense disablePadding>
              {locationEvents
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(event => (
                  <React.Fragment key={event.id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton edge="end" aria-label="edit" onClick={() => onEditEvent(event)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton edge="end" aria-label="delete" onClick={() => onDeleteEvent(event.id)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <Box sx={{ 
                        width: 4, 
                        bgcolor: getOperationColor(event.operationType),
                        alignSelf: 'stretch',
                        mr: 2,
                        borderRadius: 4
                      }} />
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {formatTime(event.time)}
                            </Typography>
                            <Typography variant="body2" component="span">
                              {event.operationType}
                            </Typography>
                          </Box>
                        }
                        secondary={showDate ? event.date : null}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              }
            </List>
          </Paper>
        ))}
      </Box>
    );
  }
  
  // By default show chronological list
  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <List dense disablePadding>
        {events
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(event => (
            <React.Fragment key={event.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton edge="end" aria-label="edit" onClick={() => onEditEvent(event)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton edge="end" aria-label="delete" onClick={() => onDeleteEvent(event.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <Box sx={{ 
                  width: 4, 
                  bgcolor: getOperationColor(event.operationType),
                  alignSelf: 'stretch',
                  mr: 2,
                  borderRadius: 4
                }} />
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {formatTime(event.time)}
                      </Typography>
                      <Typography variant="body2" component="span">
                        {event.operationType}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                      {showDate && (
                        <Typography variant="caption" color="text.secondary">
                          {event.date}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        }
      </List>
    </Paper>
  );
};

export default Timeline; 