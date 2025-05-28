import axios from 'axios';
import { DailyROB } from '../types';

// Define the API base URL
const API_URL = 'http://192.168.93.99:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for Daily ROBs
export const dailyROBsApi = {
  // Get all daily ROBs
  getAll: async (): Promise<DailyROB[]> => {
    const response = await api.get('/dailyROBs');
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get ROBs for a specific date
  getByDate: async (date: string): Promise<DailyROB[]> => {
    const response = await api.get(`/dailyROBs/date/${date}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get ROBs for a date range
  getByDateRange: async (startDate: string, endDate: string): Promise<DailyROB[]> => {
    const response = await api.get(`/dailyROBs/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Create a new ROB
  create: async (rob: Omit<DailyROB, 'id'>): Promise<DailyROB> => {
    try {
      const response = await api.post('/dailyROBs', rob);
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

  // Update a ROB
  update: async (id: string, rob: Omit<DailyROB, 'id'>): Promise<DailyROB> => {
    try {
      const response = await api.put(`/dailyROBs/${id}`, rob);
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

  // Delete a ROB
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/dailyROBs/${id}`);
    return response.data;
  },
};

export default dailyROBsApi; 