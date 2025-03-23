import { DPHours, OperationType } from '../components/Timeline';
import { DPSession } from '../dialogs/StatsDialog';

/**
 * Фильтрует события по поисковому запросу
 */
export const filterEventsByQuery = (
  events: DPHours[],
  query: string,
  formatDateFn: (date: string) => string
): DPHours[] => {
  if (!query.trim()) {
    return events;
  }

  const lowerCaseQuery = query.toLowerCase();
  
  return events.filter(event => 
    event.time.toLowerCase().includes(lowerCaseQuery) ||
    event.location.toLowerCase().includes(lowerCaseQuery) ||
    event.operationType.toLowerCase().includes(lowerCaseQuery) ||
    formatDateFn(event.date).toLowerCase().includes(lowerCaseQuery)
  );
};

/**
 * Проверяет, является ли операция DP Setup
 */
const isDPSetup = (operationType: OperationType): boolean => {
  return operationType === 'DP Setup';
};

/**
 * Проверяет, является ли операция DP Finish
 */
const isDPFinish = (operationType: OperationType): boolean => {
  return operationType === 'DP OFF';
};

/**
 * Проверяет, находится ли время в указанном диапазоне
 */
const isTimeInRange = (
  time: string,
  useTimeFilter: boolean,
  startTime: string,
  endTime: string
): boolean => {
  if (!useTimeFilter) {
    return true;
  }

  return time >= startTime && time <= endTime;
};

/**
 * Рассчитывает сессии DP на основе операций в указанном диапазоне дат
 */
export const calculateDPSessions = (
  startDate: string,
  endDate: string,
  events: DPHours[],
  useTimeFilter: boolean = false,
  startTime: string = '00:00',
  endTime: string = '23:59'
): DPSession[] => {
  // Отфильтровываем события по диапазону дат
  const filteredEvents = events.filter(event => 
    event.date >= startDate && 
    event.date <= endDate && 
    isTimeInRange(event.time, useTimeFilter, startTime, endTime)
  );

  // Группируем события по дате и локации
  const locationSessions: Record<string, Record<string, DPHours[]>> = {};

  // Инициализируем структуру данных
  filteredEvents.forEach(event => {
    if (!locationSessions[event.date]) {
      locationSessions[event.date] = {};
    }
    
    if (!locationSessions[event.date][event.location]) {
      locationSessions[event.date][event.location] = [];
    }
    
    locationSessions[event.date][event.location].push(event);
  });

  const dpSessions: DPSession[] = [];

  // Для каждой даты
  Object.keys(locationSessions).forEach(date => {
    // Для каждой локации в эту дату
    Object.keys(locationSessions[date]).forEach(location => {
      // Получаем все события для данной локации и сортируем их по времени
      const locationEvents = locationSessions[date][location]
        .sort((a, b) => a.time.localeCompare(b.time));
      
      // Инициализируем текущую сессию
      let currentSession: Partial<DPSession> | null = null;
      
      // Проходим по всем событиям локации
      locationEvents.forEach(event => {
        if (isDPSetup(event.operationType)) {
          // Начало новой сессии
          if (currentSession) {
            // Если была открыта предыдущая сессия, закрываем ее без DP Finish
            dpSessions.push({
              ...currentSession as DPSession,
              endTime: null,
              endEvent: null,
              complete: false
            });
          }
          
          // Создаем новую сессию
          currentSession = {
            date,
            location,
            startTime: event.time,
            startEvent: event,
            endTime: null,
            endEvent: null,
            complete: false
          };
        } else if (isDPFinish(event.operationType) && currentSession) {
          // Завершение текущей сессии
          dpSessions.push({
            ...currentSession as DPSession,
            endTime: event.time,
            endEvent: event,
            complete: true
          });
          
          // Сбрасываем текущую сессию
          currentSession = null;
        }
      });
      
      // Если в конце обработки осталась незавершенная сессия, добавляем ее
      if (currentSession) {
        dpSessions.push({
          ...currentSession as DPSession,
          endTime: null,
          endEvent: null,
          complete: false
        });
      }
    });
  });

  // Сортируем сессии по дате и времени начала
  return dpSessions.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });
}; 