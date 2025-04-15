import { useCallback } from 'react';
import { DPHours } from '../types';
import { formatDate } from '../utils';

export interface GroupedEvents {
  [location: string]: DPHours[][];
}

export interface EventGroupsHook {
  getGroupedEventsForDate: (date: string, events: DPHours[]) => GroupedEvents;
  getFilteredLocationsForDate: (date: string, searchQuery: string, events: DPHours[], groupedEvents: GroupedEvents) => string[];
  getFilteredEventsForLocation: (date: string, location: string, searchQuery: string, groupedEvents: GroupedEvents) => DPHours[];
}

export const useEventGroups = (): EventGroupsHook => {
  // Group events by location and operations cycle
  const getGroupedEventsForDate = useCallback((date: string, events: DPHours[]): GroupedEvents => {
    const dateEvents = events.filter(event => event.date === date);
    const grouped: GroupedEvents = {};
    
    // Temporary structure for grouping
    const tempGroups: Record<string, DPHours[][]> = {};
    
    // Process all events
    dateEvents.forEach((event) => {
      const location = event.location;
      
      // Initialize structure for location if it doesn't exist yet
      if (!tempGroups[location]) {
        tempGroups[location] = [];
        tempGroups[location].push([]);
      }
      
      // Get the last group for this location
      const lastGroup = tempGroups[location][tempGroups[location].length - 1];
      
      // Add event to current group
      lastGroup.push(event);
      
      // If this is DP OFF operation, start a new group for this location
      if (event.operationType === 'DP OFF') {
        tempGroups[location].push([]);
      }
    });
    
    // Remove empty groups and form the final structure
    Object.keys(tempGroups).forEach((location) => {
      // Filter only non-empty groups
      const nonEmptyGroups = tempGroups[location].filter(group => group.length > 0);
      if (nonEmptyGroups.length > 0) {
        grouped[location] = nonEmptyGroups;
      }
    });
    
    return grouped;
  }, []);

  // Get filtered locations based on search query
  const getFilteredLocationsForDate = useCallback((
    date: string, 
    searchQuery: string, 
    events: DPHours[],
    groupedEvents: GroupedEvents
  ): string[] => {
    if (!searchQuery.trim()) {
      // Get all locations
      const locations = Object.keys(groupedEvents);
      
      // Sort locations by their earliest operation time
      return locations.sort((locA, locB) => {
        const firstEventA = groupedEvents[locA]?.[0]?.[0];
        const firstEventB = groupedEvents[locB]?.[0]?.[0];
        
        if (!firstEventA) return 1;
        if (!firstEventB) return -1;
        
        return firstEventA.time.localeCompare(firstEventB.time);
      });
    }
    
    const query = searchQuery.toLowerCase();
    const filteredLocations: string[] = [];
    
    Object.entries(groupedEvents).forEach(([location, groups]) => {
      // Check if location contains the search string
      if (location.toLowerCase().includes(query)) {
        filteredLocations.push(location);
        return;
      }
      
      // Check if any group of events contains the search string
      const hasMatchingEvent = groups.some(group => 
        group.some(event => 
          event.time.toLowerCase().includes(query) ||
          event.operationType.toLowerCase().includes(query) ||
          formatDate(event.date).toLowerCase().includes(query)
        )
      );
      
      if (hasMatchingEvent) {
        filteredLocations.push(location);
      }
    });
    
    // Sort filtered locations by their earliest operation time
    return filteredLocations.sort((locA, locB) => {
      const firstEventA = groupedEvents[locA]?.[0]?.[0];
      const firstEventB = groupedEvents[locB]?.[0]?.[0];
      
      if (!firstEventA) return 1;
      if (!firstEventB) return -1;
      
      return firstEventA.time.localeCompare(firstEventB.time);
    });
  }, []);

  // Get filtered events for a specific location
  const getFilteredEventsForLocation = useCallback((
    date: string, 
    location: string, 
    searchQuery: string,
    groupedEvents: GroupedEvents
  ): DPHours[] => {
    if (!searchQuery.trim()) {
      // Return all event groups for this location flattened into a single array
      const groups = groupedEvents[location] || [];
      return groups.flat();
    }
    
    const query = searchQuery.toLowerCase();
    const groups = groupedEvents[location] || [];
    
    // Filter each group and return them combined
    return groups.flat().filter(event => 
      event.time.toLowerCase().includes(query) ||
      event.operationType.toLowerCase().includes(query) ||
      formatDate(event.date).toLowerCase().includes(query)
    );
  }, []);

  return {
    getGroupedEventsForDate,
    getFilteredLocationsForDate,
    getFilteredEventsForLocation
  };
}; 