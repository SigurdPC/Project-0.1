import { useCallback } from 'react';

/**
 * Хук для валидации данных, который может использоваться разными компонентами
 * @param data массив данных, среди которых ищем дубликаты
 * @param uniqueFields массив полей, по которым проверяется уникальность
 * @returns объект с функциями валидации
 */
export const useValidation = <T extends Record<string, any>>(
  data: T[],
  uniqueFields: (keyof T)[]
) => {
  /**
   * Проверяет, существует ли запись с такими же значениями полей
   * @param record запись для проверки
   * @param excludeId ID записи, которую нужно исключить из проверки (для случая редактирования)
   * @returns true, если найден дубликат
   */
  const checkDuplicate = useCallback(
    (record: Partial<T>, excludeId?: string | number): boolean => {
      return data.some((existingRecord) => {
        // Если проверяем обновление существующей записи, исключаем её из проверки
        if (excludeId !== undefined && 'id' in existingRecord && existingRecord.id === excludeId) {
          return false;
        }

        // Проверяем все указанные поля на совпадение
        return uniqueFields.every((field) => {
          const fieldName = field as string;
          return record[fieldName] !== undefined &&
            existingRecord[fieldName] !== undefined &&
            record[fieldName] === existingRecord[fieldName];
        });
      });
    },
    [data, uniqueFields]
  );

  /**
   * Проверяет, не находится ли дата в будущем
   * @param dateValue строковое значение даты в формате ISO
   * @returns true, если дата в будущем
   */
  const isFutureDate = useCallback((dateValue: string): boolean => {
    if (!dateValue) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сбрасываем время, чтобы сравнивать только даты
    
    const date = new Date(dateValue);
    date.setHours(0, 0, 0, 0);
    
    return date > today;
  }, []);

  /**
   * Ищет дубликаты в массиве записей
   * @param records массив записей для проверки
   * @returns индексы записей, которые дублируют существующие данные
   */
  const findDuplicates = useCallback(
    (records: Partial<T>[]): number[] => {
      const duplicateIndices: number[] = [];

      records.forEach((record, index) => {
        if (checkDuplicate(record)) {
          duplicateIndices.push(index);
        }
      });

      return duplicateIndices;
    },
    [checkDuplicate]
  );

  /**
   * Ищет дубликаты при редактировании группы записей 
   * @param records массив записей для проверки
   * @param getExcludeId функция для получения ID записи, которую нужно исключить
   * @returns индексы записей, которые дублируют существующие данные
   */
  const findDuplicatesForEdit = useCallback(
    (
      records: Partial<T>[],
      getExcludeId: (record: Partial<T>) => string | number | undefined
    ): number[] => {
      const duplicateIndices: number[] = [];

      records.forEach((record, index) => {
        const excludeId = getExcludeId(record);
        if (checkDuplicate(record, excludeId)) {
          duplicateIndices.push(index);
        }
      });

      return duplicateIndices;
    },
    [checkDuplicate]
  );

  return {
    checkDuplicate,
    findDuplicates,
    findDuplicatesForEdit,
    isFutureDate
  };
};

export default useValidation; 