import { useMemo, useState, useCallback } from 'react';
import { DPHours } from '../types';
import { formatDate } from '../utils';

export interface EventFiltersHook {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getEventsForDate: (date: string, events: DPHours[]) => DPHours[];
  getFilteredEventsForDate: (date: string, events: DPHours[]) => DPHours[];
  getUniqueLocationsForDate: (date: string, events: DPHours[]) => string[];
  getFilteredDatesWithEvents: (events: DPHours[]) => string[];
  getPaginatedItems: <T>(items: T[], page: number, rowsPerPage: number) => T[];
  getEventsForToday: (events: DPHours[], selectedDate: string) => DPHours[];
  getDatesWithEvents: (events: DPHours[]) => string[];
}

export const useEventFilters = (initialEvents: DPHours[] = []): EventFiltersHook => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all dates with events
  const getDatesWithEvents = useCallback((events: DPHours[]): string[] => {
    const uniqueDates = [...new Set(events.map(item => item.date))];
    return uniqueDates.sort().reverse(); // Sort by descending dates
  }, []);

  // Get events for the selected date (Today tab)
  const getEventsForToday = useCallback((events: DPHours[], selectedDate: string): DPHours[] => {
    return events
      .filter(event => event.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, []);

  // Get events for a specific date in History
  const getEventsForDate = useCallback((date: string, events: DPHours[]): DPHours[] => {
    return events
      .filter(event => event.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, []);

  // Get filtered events based on search query
  const getFilteredEventsForDate = useCallback((date: string, events: DPHours[]): DPHours[] => {
    const dateEvents = events.filter(event => event.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    if (!searchQuery.trim()) {
      return dateEvents;
    }
    
    const query = searchQuery.toLowerCase();
    
    return dateEvents.filter(event => 
      event.time.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.operationType.toLowerCase().includes(query) ||
      formatDate(event.date).toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get unique locations for a date
  const getUniqueLocationsForDate = useCallback((date: string, events: DPHours[]): string[] => {
    // Filter records by date and get unique locations
    return [...new Set(
      events
        .filter(item => item.date === date)
        .map(item => item.location)
    )];
  }, []);

  // Get filtered dates based on search query
  const getFilteredDatesWithEvents = useCallback((events: DPHours[]): string[] => {
    const allDates = getDatesWithEvents(events);
    
    if (!searchQuery.trim()) {
      return allDates;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Keep only dates with events matching search query
    return allDates.filter(date => {
      const dateEvents = events.filter(event => event.date === date);
      return dateEvents.some(event => 
        event.time.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.operationType.toLowerCase().includes(query) ||
        formatDate(event.date).toLowerCase().includes(query)
      );
    });
  }, [searchQuery, getDatesWithEvents]);

  // Pagination helper
  const getPaginatedItems = useCallback(<T>(items: T[], page: number, rowsPerPage: number): T[] => {
    const startIndex = (page - 1) * rowsPerPage;
    return items.slice(startIndex, startIndex + rowsPerPage);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    getEventsForDate,
    getFilteredEventsForDate,
    getUniqueLocationsForDate,
    getFilteredDatesWithEvents,
    getPaginatedItems,
    getEventsForToday,
    getDatesWithEvents
  };
}; 