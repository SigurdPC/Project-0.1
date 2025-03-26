import React from 'react';
import { Box, Paper, Typography, TablePagination } from '@mui/material';
import { DPHours } from '../types';
import SearchBar from '../components/SearchBar';
import HistoryItem from '../components/HistoryItem';
import LocationCard from '../components/LocationCard';
import { GroupedEvents } from '../hooks/useEventGroups';

interface HistoryViewProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  paginatedDates: string[];
  expandedDate: string | null;
  onToggleDateExpansion: (date: string) => void;
  filteredDates: string[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  getFilteredEventsForDate: (date: string) => DPHours[];
  getFilteredLocationsForDate: (date: string) => string[];
  getGroupedEventsForDate: (date: string) => GroupedEvents;
  onEditLocation: (date: string, location: string, events: DPHours[]) => void;
  onDeleteLocationEvents: (events: DPHours[]) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({
  searchQuery,
  onSearchChange,
  paginatedDates,
  expandedDate,
  onToggleDateExpansion,
  filteredDates,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  getFilteredEventsForDate,
  getFilteredLocationsForDate,
  getGroupedEventsForDate,
  onEditLocation,
  onDeleteLocationEvents
}) => {
  // Function to render history content for a date
  const renderHistoryByDate = (date: string) => {
    const locationsForDate = getFilteredLocationsForDate(date);
    const groupedEvents = getGroupedEventsForDate(date);
    
    if (locationsForDate.length === 0) {
      return (
        <Typography align="center" color="text.secondary" sx={{ py: 2 }}>
          {searchQuery ? 'Нет результатов по вашему запросу' : 'Нет данных для этой даты'}
        </Typography>
      );
    }
    
    return (
      <Box>
        {locationsForDate.map((location: string) => (
          // Render all groups for each location
          groupedEvents[location]?.map((group, groupIndex) => (
            <LocationCard
              key={`${date}-${location}-${groupIndex}`}
              location={location}
              events={group}
              onEdit={() => onEditLocation(date, location, group)}
              onDelete={() => {
                if (window.confirm(`Вы уверены, что хотите удалить все операции для этой локации "${location}"?`)) {
                  onDeleteLocationEvents(group);
                }
              }}
            />
          ))
        ))}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            placeholder="Поиск..."
            width="250px"
          />
        </Box>
      </Box>
      
      {/* Dates with expandable sections */}
      {paginatedDates.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          {paginatedDates.map(date => (
            <HistoryItem
              key={date}
              date={date}
              isExpanded={expandedDate === date}
              onToggleExpand={() => onToggleDateExpansion(date)}
              eventsCount={getFilteredEventsForDate(date).length}
              locationsCount={getFilteredLocationsForDate(date).length}
            >
              {renderHistoryByDate(date)}
            </HistoryItem>
          ))}
        </Box>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          {searchQuery ? 'Нет результатов по вашему запросу' : 'No records found'}
        </Typography>
      )}
      
      {/* Pagination for history */}
      {filteredDates.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            component="div"
            count={filteredDates.length}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="на странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
          />
        </Box>
      )}
    </Paper>
  );
};

export default HistoryView; 