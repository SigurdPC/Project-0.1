import { DPHours, OperationType } from '../components/dphours/components/Timeline';

// Тип для записи, которая будет отправляться на сервер
interface DPHoursRecordDTO {
  id?: string;
  date: string;
  time: string;
  location: string;
  operationType: OperationType;
}

// Задержка для имитации сетевого запроса
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Ключ для хранения данных в localStorage
const STORAGE_KEY = 'dphours_data';

// Получение данных из localStorage
const getData = (): DPHours[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Сохранение данных в localStorage
const saveData = (data: DPHours[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const dphoursApi = {
  /**
   * Получение всех записей
   */
  getAllRecords: async (): Promise<DPHours[]> => {
    // Имитация задержки сетевого запроса
    await delay(500);
    return getData();
  },
  
  /**
   * Получение записей по диапазону дат
   */
  getRecordsByDateRange: async (startDate: string, endDate: string): Promise<DPHours[]> => {
    await delay(300);
    const allRecords = getData();
    return allRecords.filter(record => 
      record.date >= startDate && record.date <= endDate
    );
  },
  
  /**
   * Создание новой записи
   */
  createRecord: async (record: DPHoursRecordDTO): Promise<DPHoursRecordDTO> => {
    await delay(500);
    
    const newRecord = {
      ...record,
      id: Date.now().toString()
    };
    
    const data = getData();
    data.push(newRecord as DPHours);
    saveData(data);
    
    return newRecord;
  },
  
  /**
   * Обновление существующей записи
   */
  updateRecord: async (id: string, record: Partial<DPHoursRecordDTO>): Promise<DPHoursRecordDTO> => {
    await delay(500);
    
    const data = getData();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    const updatedRecord = {
      ...data[index],
      ...record
    };
    
    data[index] = updatedRecord;
    saveData(data);
    
    return updatedRecord;
  },
  
  /**
   * Удаление записи
   */
  deleteRecord: async (id: string): Promise<void> => {
    await delay(300);
    
    const data = getData();
    const updatedData = data.filter(item => item.id !== id);
    
    if (data.length === updatedData.length) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    saveData(updatedData);
  },
  
  /**
   * Создание нескольких записей сразу
   */
  createBulkRecords: async (records: DPHoursRecordDTO[]): Promise<DPHoursRecordDTO[]> => {
    await delay(800);
    
    const data = getData();
    const newRecords = records.map(record => ({
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    }));
    
    data.push(...newRecords as DPHours[]);
    saveData(data);
    
    return newRecords;
  },
  
  /**
   * Поиск записей по запросу
   */
  searchRecords: async (query: string): Promise<DPHours[]> => {
    await delay(300);
    
    const data = getData();
    const lowerQuery = query.toLowerCase();
    
    return data.filter(record => 
      record.location.toLowerCase().includes(lowerQuery) ||
      record.operationType.toLowerCase().includes(lowerQuery) ||
      record.date.includes(lowerQuery) ||
      record.time.includes(lowerQuery)
    );
  }
};

export default dphoursApi; 