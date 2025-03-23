import React, { useMemo } from 'react';
import { 
  Box, Paper, Typography, List, ListItem, 
  ListItemText, Chip, IconButton, Divider
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DPHours, operationColors } from './types';

// Определение типа TimelineProps
interface TimelineProps {
  events: DPHours[];
  onEdit: (id: string, updatedData: DPHours) => void;
  onEditLocation: (date: string, location: string, events: DPHours[]) => void;
  onDelete?: (id: string) => void;
}

// Компонент Timeline для отображения событий
const Timeline: React.FC<TimelineProps> = ({ events, onEdit, onEditLocation, onDelete }) => {
  // Группировка событий по локациям
  const eventsByLocation = useMemo(() => {
    const grouped: Record<string, DPHours[]> = {};

    events.forEach((event: DPHours) => {
      if (!grouped[event.location]) {
        grouped[event.location] = [];
      }
      grouped[event.location].push(event);
    });
    
    // Сортировка событий внутри каждой локации по времени
    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  }, [events]);

  const handleEditLocationClick = (location: string, locationEvents: DPHours[]) => {
    // Вызываем обработчик редактирования локации, если он предоставлен
    if (locationEvents.length > 0 && onEditLocation) {
      onEditLocation(locationEvents[0].date, location, locationEvents);
    }
  };
  
  const handleDeleteLocationClick = (locationEvents: DPHours[]) => {
    // Проверяем, что onDelete существует и запрашиваем подтверждение
    if (typeof onDelete === 'function' && locationEvents.length > 0 && 
        window.confirm(`Вы уверены, что хотите удалить все операции для локации "${locationEvents[0].location}"?`)) {
      // Удаляем первую запись (обработчик сам обновит UI)
      onDelete(locationEvents[0].id);
    }
  };
  
  // Если нет событий, возвращаем пустой компонент
  if (Object.keys(eventsByLocation).length === 0) {
    return null;
  }
  
  return (
    <Box>
      {Object.entries(eventsByLocation).map(([location, locationEvents], locationIndex) => (
        <Paper key={location} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Location: {location}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                {locationEvents.length} operations
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleEditLocationClick(location, locationEvents)}
                sx={{ color: 'white', mr: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteLocationClick(locationEvents)}
                sx={{ color: 'white' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <List sx={{ width: '100%' }}>
            {locationEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  sx={{ 
                    py: 2,
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
      ))}
    </Box>
  );
};

export default Timeline; 