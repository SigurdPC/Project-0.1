/**
 * Форматирует дату из ISO формата (yyyy-mm-dd) в dd.mm.yyyy
 * @param dateStr Строка даты в формате ISO (yyyy-mm-dd)
 * @returns Отформатированная строка даты (dd.mm.yyyy)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

/**
 * Преобразует строку даты из пользовательского формата (ДД.ММ.ГГГГ) в объект Date
 * @param dateStr Строка даты в формате ДД.ММ.ГГГГ
 * @returns Объект Date или null, если формат некорректен
 */
export const parseUserDateInput = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Регулярное выражение для проверки формата ДД.ММ.ГГГГ
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = dateStr.match(dateRegex);
  
  if (!match) {
    // Пробуем формат ГГГГ-ММ-ДД (стандартный для HTML input type="date")
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoMatch = dateStr.match(isoRegex);
    
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    
    return null;
  }
  
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

/**
 * Форматирует объект Date в строку формата ДД.ММ.ГГГГ
 * @param date Объект Date
 * @returns Строка даты в формате ДД.ММ.ГГГГ
 */
export const formatDateToUserFormat = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

/**
 * Форматирует объект Date в строку формата ГГГГ-ММ-ДД (ISO)
 * @param date Объект Date
 * @returns Строка даты в формате ГГГГ-ММ-ДД
 */
export const formatDateToISOFormat = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${year}-${month}-${day}`;
}; 