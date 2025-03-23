import { DPHours, DPSession, OperationType } from './types';

/**
 * Форматирует дату из ISO-формата в более читаемый формат (DD.MM.YYYY)
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Парсит дату из пользовательского ввода (поддерживает форматы DD.MM.YYYY и YYYY-MM-DD)
 */
export const parseUserDateInput = (dateStr: string): string => {
  // Если строка уже в формате YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Если строка в формате DD.MM.YYYY или DD/MM/YYYY
  const match = dateStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // Если формат не распознан, возвращаем исходную строку
  return dateStr;
};

/**
 * Проверяет, находится ли время в пределах диапазона
 */
const isTimeInRange = (
  time: string,
  useTimeFilter: boolean,
  startTime: string,
  endTime: string
): boolean => {
  if (!useTimeFilter) return true;
  
  // Если начало смены меньше конца смены (обычная смена в течение одного дня)
  if (startTime <= endTime) {
    return time >= startTime && time <= endTime;
  } 
  // Если начало смены больше конца смены (ночная смена, пересекающая полночь)
  else {
    return time >= startTime || time <= endTime;
  }
};

/**
 * Функция для форматирования длительности в часах и минутах
 */
export const formatDuration = (minutes: number): string => {
  if (minutes === 0) return "In progress";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Функция расчета времени между DP Setup и DP OFF
 */
export const calculateDPSessions = (
  startDate: string, 
  endDate: string, 
  data: DPHours[],
  useTimeFilter: boolean = false,
  startTime: string = '00:00', 
  endTime: string = '23:59'
): DPSession[] => {
  // Отфильтруем события по указанному диапазону дат
  const filteredEvents = data.filter(event => {
    // Фильтр по диапазону дат
    const dateInRange = event.date >= startDate && event.date <= endDate;
    
    if (!useTimeFilter) return dateInRange;
    
    // Проверяем диапазон времени
    if (startTime <= endTime) {
      return dateInRange && event.time >= startTime && event.time <= endTime;
    } else {
      // Для ночной смены, пересекающей полночь
      if (event.time <= endTime) {
        return dateInRange && event.date > startDate;
      } else if (event.time >= startTime) {
        return dateInRange && event.date < endDate;
      }
      return false;
    }
  });
  
  // Сортируем события по дате и времени
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

  interface SessionTemp {
    startDate: string;
    startTime: string;
    location: string;
  }
  
  const sessions: DPSession[] = [];
  let currentSession: SessionTemp | null = null;
  
  for (const event of sortedEvents) {
    if (event.operationType === 'DP Setup') {
      // Если начинается новая сессия DP Setup
      if (currentSession) {
        // Если предыдущая сессия не завершилась, рассчитываем время до конца смены
        let durationMinutes = 0;
        
        if (useTimeFilter) {
          // Рассчитываем время до конца смены
          const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
          
          // Создаем дату-время окончания смены в тот же день
          let sessionEndDateTime: Date;
          
          // Если начало смены меньше конца смены - смена заканчивается в тот же день
          if (startTime <= endTime) {
            sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
          } else {
            // Ночная смена - заканчивается на следующий день
            const nextDay = new Date(currentSession.startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
          }
          
          // Рассчитываем длительность
          durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
          
          // Если получается отрицательное время, значит смена уже закончилась
          if (durationMinutes < 0) {
            durationMinutes = 0;
          }
        }
        
        sessions.push({
          startDate: currentSession.startDate,
          startTime: currentSession.startTime,
          endDate: null,
          endTime: null,
          location: currentSession.location,
          duration: durationMinutes
        });
      }
      
      // Начинаем новую сессию
      currentSession = {
        startDate: event.date,
        startTime: event.time,
        location: event.location
      };
    } else if (event.operationType === 'DP OFF' && currentSession) {
      // Завершаем текущую сессию
      const startDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
      const endDateTime = new Date(`${event.date}T${event.time}`);
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      
      sessions.push({
        startDate: currentSession.startDate,
        startTime: currentSession.startTime,
        endDate: event.date,
        endTime: event.time,
        location: currentSession.location,
        duration: durationMinutes
      });
      
      currentSession = null;
    }
  }
  
  // Если есть незавершенная сессия, добавляем её
  if (currentSession) {
    // Рассчитываем время до конца смены
    let durationMinutes = 0;
    
    if (useTimeFilter) {
      // Рассчитываем время до конца смены
      const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
      
      // Создаем дату-время окончания смены в тот же день
      let sessionEndDateTime: Date;
      
      // Если начало смены меньше конца смены - смена заканчивается в тот же день
      if (startTime <= endTime) {
        sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
      } else {
        // Ночная смена - заканчивается на следующий день
        const nextDay = new Date(currentSession.startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
      }
      
      // Рассчитываем длительность
      durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
      
      // Если получается отрицательное время, значит смена уже закончилась
      if (durationMinutes < 0) {
        durationMinutes = 0;
      }
    }
    
    sessions.push({
      startDate: currentSession.startDate,
      startTime: currentSession.startTime,
      endDate: null,
      endTime: null,
      location: currentSession.location,
      duration: durationMinutes
    });
  }
  
  return sessions;
};

/**
 * Подсчет общего времени для всех сессий
 */
export const calculateTotalDuration = (sessions: DPSession[]): string => {
  const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
  return formatDuration(totalMinutes);
}; 