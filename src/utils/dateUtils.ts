/**
 * Форматирует дату из ISO формата (yyyy-mm-dd) в dd/mm/yyyy
 * @param dateStr Строка даты в формате ISO (yyyy-mm-dd)
 * @returns Отформатированная строка даты (dd/mm/yyyy)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
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