import { DPHours, OperationType } from '../components/dphours/components/Timeline';
import axios from 'axios';
import API_BASE_URL from './config';

// Тип для записи, которая будет отправляться на сервер
interface DPHoursRecordDTO {
  id?: string;
  date: string;
  time: string;
  location: string;
  operationType: OperationType;
}

// API клиент для работы с бэкендом
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/dphours`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const dphoursApi = {
  /**
   * Получение всех записей
   */
  getAllRecords: async (): Promise<DPHours[]> => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching DP hours records:', error);
      return [];
    }
  },
  
  /**
   * Получение записей по диапазону дат
   */
  getRecordsByDateRange: async (startDate: string, endDate: string): Promise<DPHours[]> => {
    try {
      const response = await apiClient.get(`/dateRange`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching DP hours records by date range:', error);
      return [];
    }
  },
  
  /**
   * Создание новой записи
   */
  createRecord: async (record: DPHoursRecordDTO): Promise<DPHoursRecordDTO> => {
    try {
      const response = await apiClient.post('/', record);
      return response.data;
    } catch (error) {
      console.error('Error creating DP hours record:', error);
      throw error;
    }
  },
  
  /**
   * Обновление существующей записи
   */
  updateRecord: async (id: string, record: Partial<DPHoursRecordDTO>): Promise<DPHoursRecordDTO> => {
    try {
      const response = await apiClient.put(`/${id}`, record);
      return response.data;
    } catch (error) {
      console.error(`Error updating DP hours record with id ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Удаление записи
   */
  deleteRecord: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/${id}`);
    } catch (error) {
      console.error(`Error deleting DP hours record with id ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Создание нескольких записей сразу
   */
  createBulkRecords: async (records: DPHoursRecordDTO[]): Promise<DPHoursRecordDTO[]> => {
    try {
      const response = await apiClient.post('/bulk', records);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk DP hours records:', error);
      throw error;
    }
  },
  
  /**
   * Поиск записей по запросу
   */
  searchRecords: async (query: string): Promise<DPHours[]> => {
    try {
      const response = await apiClient.get('/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching DP hours records:', error);
      return [];
    }
  }
};

export default dphoursApi; 