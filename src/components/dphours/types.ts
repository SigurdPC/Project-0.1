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

// Интерфейс для рабочей смены в DPTime
export interface Shift {
  id: string; 
  startTime: string; // формат HH:MM
  endTime: string;   // формат HH:MM
  isOvernight: boolean; // признак ночной смены (если startTime > endTime)
}

// Интерфейс для операции DP с рассчитанным временем
export interface DPTimeOperation {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  location: string;
  totalDuration: number; // общая продолжительность в минутах
}

// Результат расчета времени по дням и сменам
export interface TimeCalculationResult {
  operationId: string;
  date: string;
  shiftId: string;
  shiftStart: string;
  shiftEnd: string;
  minutesInShift: number; // минуты работы в данной смене
  hoursInShift: number;   // часы работы в данной смене (с десятичной частью)
  startTime: string | null; // время начала работы в смене
  endTime: string | null;   // время окончания работы в смене
}

// Настройки расчета времени
export interface TimeCalculationSettings {
  startDate: string;
  endDate: string;
  shifts: Shift[];
} 