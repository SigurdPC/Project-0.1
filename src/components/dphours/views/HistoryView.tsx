import React from 'react';
import { Box, Paper, Typography, TablePagination } from '@mui/material';
import { DPHours } from '../types';
import SearchBar from '../components/SearchBar';
import HistoryItem from '../components/HistoryItem';
import LocationCard from '../components/LocationCard';
import PDFExportButton from '../components/PDFExportButton';
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
          {searchQuery ? 'No results for your query' : 'No records found'}
        </Typography>
      );
    }
    
    // Создаем блоки операций для сортировки
    interface OperationBlock {
      location: string;
      groupIndex: number;
      events: DPHours[];
      startTime: string;
      endTime: string;
      blockKey: string;
    }
    
    const operationBlocks: OperationBlock[] = [];
    
    // Для каждой локации создаем блоки операций
    locationsForDate.forEach(location => {
      if (!groupedEvents[location]) return;
      
      groupedEvents[location].forEach((group, groupIndex) => {
        if (group.length === 0) return;
        
        // Сортируем операции по времени
        const sortedEvents = [...group].sort((a, b) => a.time.localeCompare(b.time));
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        
        operationBlocks.push({
          location,
          groupIndex,
          events: sortedEvents,
          startTime: firstEvent.time,
          endTime: lastEvent.time,
          blockKey: `${date}-${location}-${groupIndex}`
        });
      });
    });
    
    // Сортируем блоки операций по времени начала
    const sortedBlocks = operationBlocks.sort((a, b) => {
      const timeCompare = a.startTime.localeCompare(b.startTime);
      if (timeCompare !== 0) return timeCompare;
      
      // Если время одинаковое, сортируем по локации
      const locA = parseInt(a.location) || 0;
      const locB = parseInt(b.location) || 0;
      return locA - locB;
    });
    
    return (
      <Box>
        {sortedBlocks.map(({ location, events, blockKey, startTime, endTime }) => (
          <LocationCard
            key={blockKey}
            location={location}
            events={events}
            onEdit={() => onEditLocation(date, location, events)}
            onDelete={() => {
              if (window.confirm(`Are you sure you want to delete all operations for this location "${location}"?`)) {
                if (events && events.length > 0) {
                  // Filter only events with IDs
                  const eventsWithIds = events.filter(event => event && event.id);
                  
                  if (eventsWithIds.length > 0) {
                    console.log(`Deleting ${eventsWithIds.length} events for location "${location}"`);
                    onDeleteLocationEvents(eventsWithIds);
                  } else {
                    console.error('No events with valid IDs found for deletion', {
                      location,
                      totalEvents: events.length
                    });
                  }
                } else {
                  console.error('No operations found for deletion');
                }
              }
            }}
          />
        ))}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {filteredDates.length > 0 && (
            <PDFExportButton
              paginatedDates={filteredDates}
              getFilteredEventsForDate={getFilteredEventsForDate}
              getFilteredLocationsForDate={getFilteredLocationsForDate}
            />
          )}
        </Box>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          placeholder="Search..."
          width="250px"
        />
      </Box>
      
      {/* Dates with expandable sections */}
      {paginatedDates.length > 0 ? (
        <Box sx={{ mb: 4 }}>
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
        <Typography align="center" color="text.secondary" sx={{ py: 6, fontSize: '1.1rem' }}>
          {searchQuery ? 'No results for your query' : 'No records found'}
        </Typography>
      )}
      
      {/* Pagination for history */}
      {filteredDates.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            component="div"
            count={filteredDates.length}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="per page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            sx={{ 
              '& .MuiTablePagination-toolbar': { 
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0,0,0,0.02)'
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default HistoryView; 