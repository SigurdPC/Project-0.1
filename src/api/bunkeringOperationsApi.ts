import axios from 'axios';
import { BunkeringOperation } from '../types';
import API_BASE_URL from './config';

// Define the API base URL
const API_URL = API_BASE_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for Bunkering Operations
export const bunkeringOperationsApi = {
  // Get all bunkering operations
  getAll: async (): Promise<BunkeringOperation[]> => {
    const response = await api.get('/bunkeringOperations');
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get operations for a specific date
  getByDate: async (date: string): Promise<BunkeringOperation[]> => {
    const response = await api.get(`/bunkeringOperations/date/${date}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Get operations for a date range
  getByDateRange: async (startDate: string, endDate: string): Promise<BunkeringOperation[]> => {
    const response = await api.get(`/bunkeringOperations/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));
  },

  // Create a new operation
  create: async (operation: Omit<BunkeringOperation, 'id'>): Promise<BunkeringOperation> => {
    try {
      const response = await api.post('/bunkeringOperations', operation);
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

  // Update an operation
  update: async (id: string, operation: Omit<BunkeringOperation, 'id'>): Promise<BunkeringOperation> => {
    try {
      const response = await api.put(`/bunkeringOperations/${id}`, operation);
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

  // Delete an operation
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/bunkeringOperations/${id}`);
    return response.data;
  },
};

export default bunkeringOperationsApi; 