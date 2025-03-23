// Определение типов операций
export type OperationType = 'DP Setup' | 'Moving in' | 'Handling Offshore' | 'Pulling Out' | 'DP OFF';

// Интерфейс для DPHours
export interface DPHours {
  id: string;
  date: string;
  location: string;
  operationType: OperationType;
  time: string;
}

// Интерфейс для рабочей сессии (от DP Setup до DP OFF)
export interface DPSession {
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  location: string;
  duration: number; // в минутах
}

// Цвета для различных типов операций
export const operationColors: Record<OperationType, string> = {
  'DP Setup': '#4caf50',      // green
  'Moving in': '#2196f3',     // blue
  'Handling Offshore': '#ff9800', // orange
  'Pulling Out': '#9c27b0',   // purple 
  'DP OFF': '#f44336'         // red
};

// Интерфейс для состояния снекбара
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Интерфейс для диапазона дат
export interface DateRange {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  useTimeFilter: boolean;
}

// Интерфейс для комплексного добавления
export interface ComplexAddState {
  open: boolean;
  date: string;
  location: string;
  operations: {
    id: string;
    time: string;
    operationType: OperationType;
  }[];
}

// Интерфейс для редактирования локации
export interface LocationEditData {
  date: string;
  oldLocation: string;
  newLocation: string;
  events: DPHours[];
} 