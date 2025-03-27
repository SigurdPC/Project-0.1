import { DPHours, DPSession, DPTimeOperation, OperationType, Shift, TimeCalculationResult } from './types';

/**
 * Formats a date from ISO format to a more readable format (DD/MM/YYYY)
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parses a date from user input (prioritizes the DD/MM/YYYY format)
 */
export const parseUserDateInput = (dateStr: string): string => {
  // If the string is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Check DD/MM/YYYY format (priority format)
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // For backward compatibility, check DD.MM.YYYY format
  match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // If the format is not recognized, return the original string
  return dateStr;
};

/**
 * Checks if a time is within a specified range
 */
const isTimeInRange = (
  time: string,
  useTimeFilter: boolean,
  startTime: string,
  endTime: string
): boolean => {
  if (!useTimeFilter) return true;
  
  // If start time is less than end time (regular shift within the same day)
  if (startTime <= endTime) {
    return time >= startTime && time <= endTime;
  } 
  // If start time is greater than end time (night shift, crossing midnight)
  else {
    return time >= startTime || time <= endTime;
  }
};

/**
 * Function to format duration in hours and minutes
 */
export const formatDuration = (minutes: number): string => {
  if (minutes === 0) return "In progress";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Function to calculate time between DP Setup and DP OFF
 */
export const calculateDPSessions = (
  startDate: string, 
  endDate: string, 
  data: DPHours[],
  useTimeFilter: boolean = false,
  startTime: string = '00:00', 
  endTime: string = '23:59'
): DPSession[] => {
  // Filter events by the specified date range
  const filteredEvents = data.filter(event => {
    // Filter by date range
    const dateInRange = event.date >= startDate && event.date <= endDate;
    
    if (!useTimeFilter) return dateInRange;
    
    // Check time range
    if (startTime <= endTime) {
      return dateInRange && event.time >= startTime && event.time <= endTime;
    } else {
      // For night shifts crossing midnight
      if (event.time <= endTime) {
        return dateInRange && event.date > startDate;
      } else if (event.time >= startTime) {
        return dateInRange && event.date < endDate;
      }
      return false;
    }
  });
  
  // Sort events by date and time
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
      // If a new DP Setup session starts
      if (currentSession) {
        // If the previous session did not end, calculate time until the end of the shift
        let durationMinutes = 0;
        
        if (useTimeFilter) {
          // Calculate time until the end of the shift
          const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
          
          // Create date-time for the end of the shift on the same day
          let sessionEndDateTime: Date;
          
          // If start time is less than end time - shift ends on the same day
          if (startTime <= endTime) {
            sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
          } else {
            // Night shift - ends on the next day
            const nextDay = new Date(currentSession.startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
          }
          
          // Calculate duration
          durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
          
          // If the result is negative time, then the shift has already ended
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
      
      // Start a new session
      currentSession = {
        startDate: event.date,
        startTime: event.time,
        location: event.location
      };
    } else if (event.operationType === 'DP OFF' && currentSession) {
      // End the current session
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
  
  // If there is an unfinished session, add it
  if (currentSession) {
    // Calculate time until the end of the shift
    let durationMinutes = 0;
    
    if (useTimeFilter) {
      // Calculate time until the end of the shift
      const sessionStartDateTime = new Date(`${currentSession.startDate}T${currentSession.startTime}`);
      
      // Create date-time for the end of the shift on the same day
      let sessionEndDateTime: Date;
      
      // If start time is less than end time - shift ends on the same day
      if (startTime <= endTime) {
        sessionEndDateTime = new Date(`${currentSession.startDate}T${endTime}`);
      } else {
        // Night shift - ends on the next day
        const nextDay = new Date(currentSession.startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        sessionEndDateTime = new Date(`${nextDayStr}T${endTime}`);
      }
      
      // Calculate duration
      durationMinutes = Math.floor((sessionEndDateTime.getTime() - sessionStartDateTime.getTime()) / (1000 * 60));
      
      // If the result is negative time, then the shift has already ended
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

/**
 * Преобразование DPHours в массив операций DPTimeOperation (от DP Setup до DP OFF)
 */
export const getDPTimeOperations = (data: DPHours[]): DPTimeOperation[] => {
  // Сортируем события по дате и времени
  const sortedEvents = [...data].sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

  const operations: DPTimeOperation[] = [];
  let currentOperation: {
    id: string;
    startDate: string;
    startTime: string;
    location: string;
  } | null = null;

  for (const event of sortedEvents) {
    if (event.operationType === 'DP Setup') {
      // Если начинается новая операция
      if (currentOperation) {
        // Если предыдущая операция не завершилась, добавляем её без окончания
        operations.push({
          id: currentOperation.id,
          startDate: currentOperation.startDate,
          startTime: currentOperation.startTime,
          endDate: null,
          endTime: null,
          location: currentOperation.location,
          totalDuration: 0 // длительность будет рассчитана позже
        });
      }

      // Начинаем новую операцию
      currentOperation = {
        id: event.id,
        startDate: event.date,
        startTime: event.time,
        location: event.location
      };
    } else if (event.operationType === 'DP OFF' && currentOperation) {
      // Завершаем текущую операцию
      const startDateTime = new Date(`${currentOperation.startDate}T${currentOperation.startTime}`);
      const endDateTime = new Date(`${event.date}T${event.time}`);
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      operations.push({
        id: currentOperation.id,
        startDate: currentOperation.startDate,
        startTime: currentOperation.startTime,
        endDate: event.date,
        endTime: event.time,
        location: currentOperation.location,
        totalDuration: durationMinutes
      });

      currentOperation = null;
    }
  }

  // Если есть незавершенная операция, добавляем её
  if (currentOperation) {
    operations.push({
      id: currentOperation.id,
      startDate: currentOperation.startDate,
      startTime: currentOperation.startTime,
      endDate: null,
      endTime: null,
      location: currentOperation.location,
      totalDuration: 0 // Текущая операция все еще в процессе
    });
  }

  return operations;
};

/**
 * Получить список дат между startDate и endDate включительно
 */
export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  // Добавляем по одному дню пока не достигнем конечной даты
  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Проверяет, перекрываются ли два временных интервала
 */
const isTimeOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string,
  isOvernight1: boolean,
  isOvernight2: boolean
): boolean => {
  // Преобразуем время в минуты для удобства сравнения
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Обработка ночных смен
  if (isOvernight1 && !isOvernight2) {
    // Первая смена ночная, вторая дневная
    return start2Min <= end1Min || start1Min <= end2Min;
  } else if (!isOvernight1 && isOvernight2) {
    // Первая смена дневная, вторая ночная
    return start1Min <= end2Min || start2Min <= end1Min;
  } else if (isOvernight1 && isOvernight2) {
    // Обе смены ночные
    return true; // Ночные смены всегда перекрываются хотя бы частично
  } else {
    // Обе смены дневные - стандартная проверка перекрытия интервалов
    return start1Min < end2Min && start2Min < end1Min;
  }
};

/**
 * Рассчитывает время операции, попадающее в заданную смену для конкретной даты
 */
const calculateTimeInShift = (
  operationDate: string, // Дата для которой рассчитываем
  operationStartDate: string,
  operationStartTime: string,
  operationEndDate: string | null,
  operationEndTime: string | null,
  shiftStart: string,
  shiftEnd: string,
  isOvernightShift: boolean
): {
  minutes: number;
  startTime: string | null;
  endTime: string | null;
} => {
  // Преобразуем время в минуты для расчетов
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Обратное преобразование из минут в формат времени HH:MM
  const toTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const shiftStartMin = toMinutes(shiftStart);
  const shiftEndMin = toMinutes(shiftEnd);
  const dayTotalMinutes = 24 * 60; // Всего минут в сутках

  // Определяем начало и конец операции для данной даты
  let opStartMin: number;
  let opEndMin: number;
  let opStartTimeForDay: string | null = null;
  let opEndTimeForDay: string | null = null;

  // Операция начинается в тот же день
  if (operationDate === operationStartDate) {
    opStartMin = toMinutes(operationStartTime);
    opStartTimeForDay = operationStartTime;
  } else if (operationDate > operationStartDate) {
    // Операция началась раньше текущего дня
    opStartMin = 0; // Начало дня
    opStartTimeForDay = '00:00';
  } else {
    // Операция еще не началась в этот день
    return { minutes: 0, startTime: null, endTime: null };
  }

  // Операция заканчивается в тот же день
  if (operationEndDate === operationDate && operationEndTime) {
    opEndMin = toMinutes(operationEndTime);
    opEndTimeForDay = operationEndTime;
  } else if (operationEndDate && operationDate > operationEndDate) {
    // Операция уже закончилась до этого дня
    return { minutes: 0, startTime: null, endTime: null };
  } else if (!operationEndDate || operationDate < operationEndDate) {
    // Операция продолжается после этого дня или все еще идет
    opEndMin = dayTotalMinutes - 1; // Конец дня (23:59)
    opEndTimeForDay = '23:59';
  } else {
    // Некорректные данные
    return { minutes: 0, startTime: null, endTime: null };
  }

  // Расчет пересечения операции и смены
  let intersectionStartMin: number;
  let intersectionEndMin: number;

  if (isOvernightShift) {
    // Ночная смена (например, 22:00 - 06:00)
    if (opStartMin >= shiftStartMin) {
      // Начало операции в тот же день после начала смены
      intersectionStartMin = opStartMin;
    } else if (opStartMin < shiftEndMin) {
      // Начало операции в тот же день до окончания смены (утром)
      intersectionStartMin = 0;
    } else {
      // Операция не пересекается со сменой
      return { minutes: 0, startTime: null, endTime: null };
    }

    if (opEndMin <= shiftEndMin) {
      // Окончание операции до окончания смены (утром)
      intersectionEndMin = opEndMin;
    } else if (opEndMin >= shiftStartMin) {
      // Окончание операции после начала смены (вечером)
      intersectionEndMin = dayTotalMinutes;
    } else {
      // Операция не пересекается со сменой
      return { minutes: 0, startTime: null, endTime: null };
    }

    // Расчет общего времени (может быть в двух интервалах: вечер и утро)
    let totalMinutes = 0;

    // Проверяем вечерний интервал
    if (opStartMin <= dayTotalMinutes && opEndMin >= shiftStartMin) {
      const eveningStart = Math.max(opStartMin, shiftStartMin);
      const eveningEnd = Math.min(opEndMin, dayTotalMinutes);
      if (eveningEnd > eveningStart) {
        totalMinutes += (eveningEnd - eveningStart);
        
        // Обновляем время начала в смене, если операция началась в вечернюю часть
        if (intersectionStartMin === opStartMin && opStartMin >= shiftStartMin) {
          opStartTimeForDay = toTimeString(eveningStart);
        }
      }
    }

    // Проверяем утренний интервал
    if (opStartMin <= shiftEndMin && opEndMin >= 0) {
      const morningStart = Math.max(opStartMin, 0);
      const morningEnd = Math.min(opEndMin, shiftEndMin);
      if (morningEnd > morningStart) {
        totalMinutes += (morningEnd - morningStart);
        
        // Обновляем время окончания в смене, если операция закончилась в утреннюю часть
        if (intersectionEndMin === opEndMin && opEndMin <= shiftEndMin) {
          opEndTimeForDay = toTimeString(morningEnd);
        }
      }
    }

    return { 
      minutes: totalMinutes,
      startTime: opStartTimeForDay,
      endTime: opEndTimeForDay
    };
  } else {
    // Дневная смена (например, 08:00 - 20:00)
    intersectionStartMin = Math.max(opStartMin, shiftStartMin);
    intersectionEndMin = Math.min(opEndMin, shiftEndMin);

    if (intersectionEndMin <= intersectionStartMin) {
      // Операция не пересекается со сменой
      return { minutes: 0, startTime: null, endTime: null };
    }

    // Если время начала/окончания определено операцией, а не границами дня/смены
    if (intersectionStartMin === opStartMin) {
      opStartTimeForDay = operationStartTime;
    } else {
      opStartTimeForDay = toTimeString(intersectionStartMin);
    }

    if (intersectionEndMin === opEndMin) {
      opEndTimeForDay = operationEndTime || '23:59';
    } else {
      opEndTimeForDay = toTimeString(intersectionEndMin);
    }

    return { 
      minutes: intersectionEndMin - intersectionStartMin,
      startTime: opStartTimeForDay,
      endTime: opEndTimeForDay
    };
  }
};

/**
 * Расчет времени операций по сменам
 */
export const calculateOperationTimesByShifts = (
  operations: DPTimeOperation[], 
  startDate: string, 
  endDate: string, 
  shifts: Shift[]
): TimeCalculationResult[] => {
  const results: TimeCalculationResult[] = [];
  const datesInRange = getDatesInRange(startDate, endDate);

  // Для каждой операции
  operations.forEach(operation => {
    // Для каждой даты в заданном диапазоне
    datesInRange.forEach(date => {
      // Для каждой смены рассчитываем время
      shifts.forEach(shift => {
        const { minutes, startTime, endTime } = calculateTimeInShift(
          date,
          operation.startDate,
          operation.startTime,
          operation.endDate,
          operation.endTime,
          shift.startTime,
          shift.endTime,
          shift.isOvernight
        );

        // Если есть время операции в эту смену
        if (minutes > 0) {
          results.push({
            operationId: operation.id,
            date,
            shiftId: shift.id,
            shiftStart: shift.startTime,
            shiftEnd: shift.endTime,
            minutesInShift: minutes,
            hoursInShift: Math.round((minutes / 60) * 100) / 100, // Округляем до 2 знаков
            startTime,
            endTime
          });
        }
      });
    });
  });

  return results;
}; 