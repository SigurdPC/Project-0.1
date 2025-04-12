import axios from 'axios';
import { DailyEvent } from '../types';

// Define the API base URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for Daily Events
export const dailyEventsApi = {
  // Get all daily events
  getAll: async (): Promise<DailyEvent[]> => {
    const response = await api.get('/dailyEvents');
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get events for a specific date
  getByDate: async (date: string): Promise<DailyEvent[]> => {
    const response = await api.get(`/dailyEvents/date/${date}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get events for a date range
  getByDateRange: async (startDate: string, endDate: string): Promise<DailyEvent[]> => {
    const response = await api.get(`/dailyEvents/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Create a new event
  create: async (event: Omit<DailyEvent, 'id'>): Promise<DailyEvent> => {
    try {
      const response = await api.post('/dailyEvents', event);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error: any) {
      // Ensure the error is properly propagated with any server information
      if (error.response && error.response.data) {
        // Convert the server error to a more detailed exception
        const serverError = new Error(error.response.data.message || 'Server error');
        (serverError as any).response = error.response;
        (serverError as any).data = error.response.data;
        throw serverError;
      }
      throw error; // If not a server response error, just rethrow
    }
  },

  // Update an event
  update: async (id: string, event: Omit<DailyEvent, 'id'>): Promise<DailyEvent> => {
    try {
      const response = await api.put(`/dailyEvents/${id}`, event);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error: any) {
      // Ensure the error is properly propagated with any server information
      if (error.response && error.response.data) {
        // Convert the server error to a more detailed exception
        const serverError = new Error(error.response.data.message || 'Server error');
        (serverError as any).response = error.response;
        (serverError as any).data = error.response.data;
        throw serverError;
      }
      throw error; // If not a server response error, just rethrow
    }
  },

  // Delete an event
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/dailyEvents/${id}`);
    return response.data;
  },
};

export default dailyEventsApi; 