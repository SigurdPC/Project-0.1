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
 * Преобразует пользовательский ввод dd.mm.yyyy в yyyy-mm-dd
 * @param value Строка даты в пользовательском формате
 * @returns Строка даты в формате ISO
 */
export const parseUserDateInput = (value: string): string => {
  // Проверяем, соответствует ли ввод формату dd.mm.yyyy (приоритетный формат)
  const ddmmyyyyDotRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  // Проверяем, соответствует ли ввод формату dd/mm/yyyy (для обратной совместимости)
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  // Сначала проверяем формат с точками
  let match = value.match(ddmmyyyyDotRegex);
  if (match) {
    const [_, day, month, year] = match;
    // Преобразуем в формат yyyy-mm-dd
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Затем проверяем формат со слешами для обратной совместимости
  match = value.match(ddmmyyyyRegex);
  if (match) {
    const [_, day, month, year] = match;
    // Преобразуем в формат yyyy-mm-dd
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Если не соответствует никакому формату, возвращаем как есть
  return value;
}; 