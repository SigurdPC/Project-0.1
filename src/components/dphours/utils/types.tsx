import { DPHours, OperationType } from '../components/Timeline';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export interface DateRangeState {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  useTimeFilter: boolean;
}

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

export interface LocationEditState {
  date: string;
  oldLocation: string;
  newLocation: string;
  events: DPHours[];
} 