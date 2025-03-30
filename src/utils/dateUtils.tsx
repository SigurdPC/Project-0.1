/**
 * Formats a date from ISO format (yyyy-mm-dd) to a more readable format (DD/MM/YYYY)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    // In case of error, return the original string
    return dateStr;
  }
};

/**
 * Formats time to 12-hour format with AM/PM
 */
export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // Check HH:MM format
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) {
    return timeStr;
  }
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12 in 12-hour format
  
  return `${hours}:${minutes} ${suffix}`;
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Converts a date from various formats to ISO format (YYYY-MM-DD)
 */
export const parseUserDateInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // If already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Check DD.MM.YYYY format
  const ddmmyyyy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
  if (ddmmyyyy) {
    const [_, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }
  
  // Check other common formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // If format not recognized, return original string
  return dateStr;
};

/**
 * Compares two dates, returns true if they are the same
 */
export const compareDates = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) return false;
  
  const d1 = parseUserDateInput(date1);
  const d2 = parseUserDateInput(date2);
  
  return d1 === d2;
};

/**
 * Checks if a date is today
 */
export const isToday = (dateStr: string): boolean => {
  const today = getCurrentDate();
  return compareDates(dateStr, today);
};

/**
 * Adds the specified number of days to a date
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Formats a date in a human-readable way based on the current date
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