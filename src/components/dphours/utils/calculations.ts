import { OperationTime } from '../components/DPTimeResults';
import { parseUserDateInput } from '../../../utils/dateUtils';

// Интерфейс настроек для расчета
export interface DPTimeSettings {
  dateStart: string;
  dateEnd: string;
  shifts: {
    id: string;
    startTime: string;
    endTime: string;
    isOvernight: boolean;
  }[];
}

// Функция для генерации списка дат в заданном диапазоне
const generateDateRange = (startDateStr: string, endDateStr: string): string[] => {
  const startDate = parseUserDateInput(startDateStr);
  const endDate = parseUserDateInput(endDateStr);
  
  if (!startDate || !endDate) {
    return [];
  }
  
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const endDateValue = new Date(endDate);
  
  // Пока текущая дата меньше или равна конечной дате
  while (currentDate <= endDateValue) {
    dates.push(currentDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }));
    
    // Увеличиваем текущую дату на 1 день
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Функция форматирования часов и минут
const formatHoursAndMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}ч ${minutes}м`;
};

// Функция для создания записей о времени операций
export const calculateOperationTimes = (settings: DPTimeSettings): OperationTime[] => {
  const { dateStart, dateEnd, shifts } = settings;
  
  // Получаем все даты в диапазоне
  const dateRange = generateDateRange(dateStart, dateEnd);
  
  // Результаты расчета
  const results: OperationTime[] = [];
  
  // Для каждой даты и каждой смены создаем операцию
  dateRange.forEach(date => {
    shifts.forEach(shift => {
      // Рассчитываем продолжительность смены в минутах
      const startHour = parseInt(shift.startTime.split(':')[0]);
      const startMin = parseInt(shift.startTime.split(':')[1]);
      const endHour = parseInt(shift.endTime.split(':')[0]);
      const endMin = parseInt(shift.endTime.split(':')[1]);
      
      let durationMinutes;
      if (shift.isOvernight) {
        // Для ночной смены: (24 - startHour) + endHour часов
        durationMinutes = (24 - startHour) * 60 - startMin + endHour * 60 + endMin;
      } else {
        // Для дневной смены: endHour - startHour часов
        durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
      }
      
      // Создаем запись об операции
      const operation: OperationTime = {
        date,
        startTime: `${date} ${shift.startTime}`,
        endTime: shift.isOvernight 
          ? `${getNextDay(date)} ${shift.endTime}` 
          : `${date} ${shift.endTime}`,
        shift: `${shift.startTime} - ${shift.endTime}`,
        hoursInShift: formatHoursAndMinutes(durationMinutes)
      };
      
      results.push(operation);
    });
  });
  
  return results;
};

// Функция для получения следующего дня
const getNextDay = (dateStr: string): string => {
  const parts = dateStr.split('.');
  
  if (parts.length !== 3) {
    return dateStr; // Возвращаем исходную строку, если формат не соответствует
  }
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Месяцы в JS идут от 0 до 11
  const year = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + 1);
  
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}; 