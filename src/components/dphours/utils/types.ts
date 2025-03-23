import { DPHours } from '../components/Timeline';

// Состояние для управления сортировкой
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Состояние для отображения сообщений
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Состояние для фильтрации по дате
export interface DateRangeState {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  useTimeFilter: boolean;
}

// Состояние для комплексного добавления
export interface ComplexAddState {
  open: boolean;
  date: string;
  location: string;
  operations: {
    id: string;
    time: string;
    operationType: string;
  }[];
}

// Состояние для редактирования локации
export interface LocationEditState {
  date: string;
  oldLocation: string;
  newLocation: string;
  events: DPHours[];
} 