/**
 * Форматирует дату из ISO формата (yyyy-mm-dd) в более читаемый формат (DD/MM/YYYY)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Проверяем, валидная ли дата
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    // В случае ошибки, возвращаем исходную строку
    return dateStr;
  }
};

/**
 * Форматирует время в 12-часовой формат с AM/PM
 */
export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // Проверяем формат HH:MM
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) {
    return timeStr;
  }
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 должен быть 12 в 12-часовом формате
  
  return `${hours}:${minutes} ${suffix}`;
};

/**
 * Получает текущую дату в формате строки ISO (YYYY-MM-DD)
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Преобразует дату из разных форматов в ISO формат (YYYY-MM-DD)
 */
export const parseUserDateInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Если уже в формате ISO, возвращаем как есть
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Проверяем формат ДД.ММ.ГГГГ
  const ddmmyyyy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
  if (ddmmyyyy) {
    const [_, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }
  
  // Проверяем другие распространенные форматы
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Если не удалось распознать, возвращаем исходную строку
  return dateStr;
};

/**
 * Сравнивает две даты, возвращает true, если они одинаковые
 */
export const compareDates = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) return false;
  
  const d1 = parseUserDateInput(date1);
  const d2 = parseUserDateInput(date2);
  
  return d1 === d2;
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isToday = (dateStr: string): boolean => {
  const today = getCurrentDate();
  return compareDates(dateStr, today);
};

/**
 * Добавляет указанное количество дней к дате
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Форматирует дату в человекочитаемый вид с учетом сегодняшней даты
 */
export const formatDateRelative = (dateStr: string): string => {
  if (isToday(dateStr)) {
    return 'Today';
  }
  
  if (compareDates(dateStr, addDays(getCurrentDate(), -1))) {
    return 'Yesterday';
  }
  
  if (compareDates(dateStr, addDays(getCurrentDate(), 1))) {
    return 'Tomorrow';
  }
  
  return formatDate(dateStr);
}; 