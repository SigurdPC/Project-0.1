import React, { useState } from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Chip,
  Collapse
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  // Состояние для отслеживания свернутости/развернутости содержимого
  const [expanded, setExpanded] = useState<boolean>(true);

  // Обработчик переключения состояния
  const handleToggleExpand = () => {
    setExpanded(prev => !prev);
  };

  // Проверка наличия событий перед удалением
  const handleDelete = (e: React.MouseEvent) => {
    // Останавливаем всплытие события, чтобы не сработал обработчик клика на заголовке
    e.stopPropagation();
    
    if (!events || events.length === 0) {
      console.error('Cannot delete: No events provided for location', location);
      return;
    }
    
    // Проверяем, что есть хотя бы одно событие с id
    const hasValidIds = events.some(event => event && event.id);
    if (!hasValidIds) {
      console.error('Cannot delete: No events with valid IDs for location', location);
      return;
    }
    
    console.log('Deleting location with events:', events);
    onDelete();
  };

  // Обработчик редактирования с предотвращением всплытия
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };
  
  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box 
        sx={{ 
          p: 1.5, 
          bgcolor: 'primary.light', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onClick={handleToggleExpand}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {expanded ? <ExpandLessIcon sx={{ mr: 1 }} /> : <ExpandMoreIcon sx={{ mr: 1 }} />}
          <Typography variant="subtitle1" fontWeight="bold">
            {location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">
            {events.length} operations
          </Typography>
          <IconButton 
            size="small"
            onClick={handleEdit}
            sx={{ color: 'white', ml: 1, mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            onClick={handleDelete}
            sx={{ color: 'white' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{ width: '100%' }}>
          {events.map((event, index) => (
            <React.Fragment key={event.id || `temp-${index}`}>
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
      </Collapse>
    </Paper>
  );
};

export default LocationCard; 