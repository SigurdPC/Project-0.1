import axios from 'axios';
import { DPHours } from '../types';
import API_BASE_URL from './config';

// Define the API base URL
const API_URL = API_BASE_URL;

// Define the DPHours interface to match the backend model
export interface DPHours {
  id?: string;
  date: string;
  time: string;
  location: string;
  operationType: 'DP Setup' | 'Moving in' | 'Handling Offshore' | 'Pulling Out' | 'DP OFF';
  createdAt?: Date;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for DP Hours
export const dphoursApi = {
  // Get all DP hours records
  getAllRecords: async (): Promise<DPHours[]> => {
    const response = await api.get('/dphours');
    return response.data;
  },

  // Get records for a specific date
  getRecordsByDate: async (date: string): Promise<DPHours[]> => {
    const response = await api.get(`/dphours/date/${date}`);
    return response.data;
  },

  // Get records for a date range
  getRecordsByDateRange: async (startDate: string, endDate: string): Promise<DPHours[]> => {
    const response = await api.get(`/dphours/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Create a new record
  createRecord: async (record: Omit<DPHours, 'id' | 'createdAt'>): Promise<DPHours> => {
    try {
      const response = await api.post('/dphours', record);
      return response.data;
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

  // Update a record
  updateRecord: async (id: string, record: Omit<DPHours, 'id' | 'createdAt'>): Promise<DPHours> => {
    try {
      const response = await api.put(`/dphours/${id}`, record);
      return response.data;
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

  // Delete a record
  deleteRecord: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/dphours/${id}`);
    return response.data;
  },
};

export default dphoursApi; 