import axios from 'axios';

// Define the API base URL
const API_URL = 'http://localhost:5000/api';

// Define the DPHours interface to match the backend model
export interface DPHours {
  _id?: string;
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
  createRecord: async (record: Omit<DPHours, '_id' | 'id' | 'createdAt'>): Promise<DPHours> => {
    const response = await api.post('/dphours', record);
    return response.data;
  },

  // Update a record
  updateRecord: async (id: string, record: Omit<DPHours, '_id' | 'id' | 'createdAt'>): Promise<DPHours> => {
    const response = await api.put(`/dphours/${id}`, record);
    return response.data;
  },

  // Delete a record
  deleteRecord: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/dphours/${id}`);
    return response.data;
  },
};

export default dphoursApi; 