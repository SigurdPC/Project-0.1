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
  // Группировка событий по локациям с разделением по операциям DP OFF
  const eventsByLocation = useMemo(() => {
    const grouped: Record<string, DPHours[][]> = {};
    
    // Временная структура для группировки
    const tempGroups: Record<string, DPHours[][]> = {};
    
    // Сначала сортируем события по времени
    const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
    
    // Проходим по всем событиям
    sortedEvents.forEach((event) => {
      const location = event.location;
      
      // Инициализируем структуру для локации, если её ещё нет
      if (!tempGroups[location]) {
        tempGroups[location] = [];
        tempGroups[location].push([]);
      }
      
      // Получаем последнюю группу для этой локации
      const lastGroup = tempGroups[location][tempGroups[location].length - 1];
      
      // Добавляем событие в текущую группу
      lastGroup.push(event);
      
      // Если это операция DP OFF, начинаем новую группу для этой локации
      if (event.operationType === 'DP OFF') {
        tempGroups[location].push([]);
      }
    });
    
    // Удаляем пустые группы и формируем финальную структуру
    Object.keys(tempGroups).forEach((location) => {
      // Фильтруем только непустые группы
      const nonEmptyGroups = tempGroups[location].filter(group => group.length > 0);
      if (nonEmptyGroups.length > 0) {
        grouped[location] = nonEmptyGroups;
      }
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
    // Проверяем, что onDelete существует и что есть события
    if (typeof onDelete === 'function' && locationEvents.length > 0) {
      // Передаем ID первой записи в группе для обработки
      onDelete(locationEvents[0].id);
    }
  };
  
  // Если нет событий, возвращаем пустой компонент
  if (Object.keys(eventsByLocation).length === 0) {
    return null;
  }
  
  return (
    <Box>
      {Object.entries(eventsByLocation).map(([location, locationGroups]) => (
        // Отображаем каждую группу отдельно
        locationGroups.map((locationEvents, groupIndex) => (
          <Paper key={`${location}-${groupIndex}`} sx={{ mb: 3, overflow: 'hidden' }}>
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
        ))
      ))}
    </Box>
  );
};

export default Timeline; 