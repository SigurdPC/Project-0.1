import { useState, useCallback } from 'react';
import { DPHours, OperationType } from '../types';

// Определяем правильную последовательность операций
const operationSequence: OperationType[] = [
  'DP Setup', 
  'Moving in', 
  'Handling Offshore', 
  'Pulling Out', 
  'DP OFF'
];

interface ValidationError {
  field: string;
  message: string;
}

export const useValidation = (data: DPHours[]) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Проверка на дубликаты
  const checkDuplicate = useCallback((record: Omit<DPHours, 'id'>, excludeId?: string): boolean => {
    return data.some(existingRecord => 
      // Исключаем текущую запись при редактировании
      (excludeId ? existingRecord.id !== excludeId : true) && 
      existingRecord.date === record.date && 
      existingRecord.time === record.time && 
      existingRecord.location === record.location
    );
  }, [data]);

  // Проверка на правильную последовательность операций в пределах локации, с учетом многодневных операций
  const validateOperationSequence = useCallback((location: string, operations: DPHours[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Фильтруем операции только для указанной локации
    const locationOperations = operations.filter(op => op.location === location);
    
    // Если нет операций или только одна операция, то последовательность не нарушена
    if (locationOperations.length <= 1) return [];
    
    // Сортируем операции сначала по дате, затем по времени
    const sortedOps = [...locationOperations].sort((a, b) => {
      // Сначала сравниваем по дате
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // Если даты одинаковые, сравниваем по времени
      return a.time.localeCompare(b.time);
    });
    
    // Группируем операции по датам
    const opsByDate: Record<string, DPHours[]> = {};
    sortedOps.forEach(op => {
      if (!opsByDate[op.date]) {
        opsByDate[op.date] = [];
      }
      opsByDate[op.date].push(op);
    });
    
    // Получаем все даты в отсортированном порядке
    const dates = Object.keys(opsByDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Проверяем, что первая операция для локации (на самую раннюю дату) - это DP Setup
    const firstDate = dates[0];
    const firstDayOps = opsByDate[firstDate].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    
    if (firstDayOps[0].operationType !== 'DP Setup') {
      errors.push({
        field: 'operationType',
        message: `First operation for location must be DP Setup, but found ${firstDayOps[0].operationType}`
      });
    }
    
    // Проверяем, что на каждый день для локации соблюдается правильная последовательность
    dates.forEach(date => {
      const dayOps = opsByDate[date].sort((a, b) => a.time.localeCompare(b.time));
      
      // Проверяем, что операции этого дня не конфликтуют по времени
      for (let i = 0; i < dayOps.length - 1; i++) {
        if (dayOps[i].time === dayOps[i + 1].time) {
          errors.push({
            field: 'time',
            message: `Time conflict: Multiple operations (${dayOps[i].operationType} and ${dayOps[i + 1].operationType}) at the same time ${dayOps[i].time} on ${date}`
          });
        }
      }
      
      // Проверяем, что операции идут в правильной последовательности в течение дня
      for (let i = 0; i < dayOps.length - 1; i++) {
        const currentIndex = operationSequence.indexOf(dayOps[i].operationType);
        const nextIndex = operationSequence.indexOf(dayOps[i + 1].operationType);
        
        if (currentIndex >= nextIndex) {
          errors.push({
            field: 'operationType',
            message: `Invalid operation sequence: ${dayOps[i].operationType} cannot be followed by ${dayOps[i + 1].operationType} on ${date}`
          });
        }
      }
    });
    
    // Проверяем, что последняя операция на последний день - DP OFF, если он в принципе есть на локации
    const hasOff = sortedOps.some(op => op.operationType === 'DP OFF');
    const lastDate = dates[dates.length - 1];
    const lastDayOps = opsByDate[lastDate].sort((a, b) => a.time.localeCompare(b.time));
    
    if (hasOff && lastDayOps[lastDayOps.length - 1].operationType !== 'DP OFF') {
      errors.push({
        field: 'operationType',
        message: `DP OFF must be the last operation for location, but found ${lastDayOps[lastDayOps.length - 1].operationType}`
      });
    }
    
    // Проверяем наличие DP Setup в принципе
    const hasSetup = sortedOps.some(op => op.operationType === 'DP Setup');
    
    if (hasOff && !hasSetup) {
      errors.push({
        field: 'operationType',
        message: `Missing DP Setup: Location has DP OFF operation but no DP Setup`
      });
    }
    
    return errors;
  }, []);

  // Проверка на перекрытие времени с другими операциями на других локациях
  const validateTimeOverlap = useCallback((record: Omit<DPHours, 'id'>, excludeId?: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Если операция DP Setup - не проверяем перекрытие, потому что 
    // для нее уже есть проверка validateDpOffOnPreviousLocation
    if (record.operationType === 'DP Setup') return [];
    
    // Фильтруем операции на других локациях И ТОЛЬКО ДЛЯ ТОЙ ЖЕ ДАТЫ
    const otherLocations = data.filter(op => 
      (excludeId ? op.id !== excludeId : true) && 
      op.location !== record.location &&
      op.date === record.date // Добавляем проверку на ту же дату
    );
    
    if (otherLocations.length === 0) return [];
    
    // Группируем операции по локациям
    const locationGroups = otherLocations.reduce((groups, op) => {
      if (!groups[op.location]) {
        groups[op.location] = [];
      }
      groups[op.location].push(op);
      return groups;
    }, {} as Record<string, DPHours[]>);
    
    // Используем только время (без даты) для текущей операции для сравнения
    const recordTime = record.time;
    
    // Проверяем каждую группу локаций на перекрытие времени
    for (const location in locationGroups) {
      const locationOps = locationGroups[location];
      
      // Сортируем операции по времени (для одинаковой даты)
      const sortedOps = [...locationOps].sort((a, b) => a.time.localeCompare(b.time));
      
      // Проверяем только если на локации есть хотя бы две операции (начало и конец)
      if (sortedOps.length >= 2) {
        const firstOp = sortedOps[0];
        const lastOp = sortedOps[sortedOps.length - 1];
        
        // Проверяем, что операция не находится между первой и последней операцией на другой локации
        if (recordTime >= firstOp.time && recordTime <= lastOp.time) {
          errors.push({
            field: 'time',
            message: `Time conflict: Multiple operations at the same time ${record.time} on ${record.date}`
          });
          break;
        }
      }
      
      // Также проверяем на точное совпадение времени с любой операцией
      if (sortedOps.some(op => op.time === recordTime)) {
        errors.push({
          field: 'time',
          message: `Time conflict: Multiple operations (${record.operationType} and ${sortedOps.find(op => op.time === recordTime)?.operationType}) at the same time ${record.time} on ${record.date}`
        });
        break;
      }
    }
    
    return errors;
  }, [data]);

  // Проверка на наличие DP OFF на предыдущей локации с учетом многодневных операций
  const validateDpOffOnPreviousLocation = useCallback((record: Omit<DPHours, 'id'>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Если это не DP Setup (первая операция на локации), то не требуется проверка
    if (record.operationType !== 'DP Setup') return [];
    
    // Находим все незавершенные операции (локации без DP OFF)
    // Ищем все локации в базе данных
    const allLocations = new Set<string>();
    data.forEach(op => {
      allLocations.add(op.location);
    });
    
    // Проверяем каждую локацию, кроме текущей
    for (const loc of Array.from(allLocations)) {
      if (loc === record.location) continue;
      
      // Находим все операции для этой локации
      const locationOps = data.filter(op => op.location === loc);
      
      // Если нет операций, пропускаем
      if (locationOps.length === 0) continue;
      
      // Сортируем операции по дате и времени
      const sortedOps = [...locationOps].sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.time.localeCompare(b.time);
      });
      
      // Проверяем, есть ли в последних операциях DP OFF
      const lastOp = sortedOps[sortedOps.length - 1];
      
      // Проверяем, завершена ли операция на этой локации (DP OFF)
      // и что последняя операция была раньше текущей
      if (lastOp.operationType !== 'DP OFF') {
        // Проверяем, предшествует ли последняя операция локации текущей операции
        const lastOpDate = new Date(`${lastOp.date}T${lastOp.time}`);
        const currentOpDate = new Date(`${record.date}T${record.time}`);
        
        if (lastOpDate < currentOpDate) {
          errors.push({
            field: 'operationType',
            message: `Previous location "${loc}" does not have a DP OFF operation before starting at "${record.location}". Last operation was ${lastOp.operationType} at ${lastOp.date} ${lastOp.time}`
          });
        }
      }
    }
    
    return errors;
  }, [data]);

  // Комплексная валидация для одной записи с учетом многодневных операций
  const validateRecord = useCallback((record: Omit<DPHours, 'id'>, excludeId?: string): ValidationError[] => {
    let allErrors: ValidationError[] = [];
    
    // Проверка на дубликаты
    if (checkDuplicate(record, excludeId)) {
      allErrors.push({
        field: 'general',
        message: `Duplicate: An operation at ${record.time} already exists for location ${record.location} on ${record.date}`
      });
    }
    
    // Получаем все операции для этой локации, отсортированные по дате и времени
    const sameLocation = data.filter(op => 
      (excludeId ? op.id !== excludeId : true) && 
      op.location === record.location
    );
    
    // Если операций нет и это не DP Setup, то ошибка
    if (sameLocation.length === 0 && record.operationType !== 'DP Setup') {
      allErrors.push({
        field: 'operationType',
        message: `First operation for a new location must be DP Setup, but found ${record.operationType}`
      });
      return allErrors; // Возвращаем ошибку сразу, дальше нет смысла проверять
    }
    
    // Для DP Setup нужны особые проверки
    if (record.operationType === 'DP Setup') {
      // Проверяем, что на данной локации нет операций до этой
      const sortedOps = [...sameLocation].sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.time.localeCompare(b.time);
      });
      
      if (sortedOps.length > 0) {
        const firstOp = sortedOps[0];
        const firstDateTime = new Date(`${firstOp.date}T${firstOp.time}`);
        const currentDateTime = new Date(`${record.date}T${record.time}`);
        
        if (firstDateTime < currentDateTime) {
          // Если уже есть более ранняя операция на этой локации
          allErrors.push({
            field: 'operationType',
            message: `DP Setup must be the first operation for location ${record.location}, but there is an earlier operation on ${firstOp.date} at ${firstOp.time}`
          });
        }
      }
      
      // Проверка на наличие DP OFF на предыдущих локациях
      allErrors = [...allErrors, ...validateDpOffOnPreviousLocation(record)];
    } 
    // Для DP OFF нужны особые проверки
    else if (record.operationType === 'DP OFF') {
      // Проверяем, что на данной локации есть DP Setup до этой операции
      const hasSetupBefore = sameLocation.some(op => {
        if (op.operationType !== 'DP Setup') return false;
        
        const opDateTime = new Date(`${op.date}T${op.time}`);
        const currentDateTime = new Date(`${record.date}T${record.time}`);
        
        return opDateTime < currentDateTime;
      });
      
      if (!hasSetupBefore) {
        allErrors.push({
          field: 'operationType',
          message: `Missing DP Setup: Cannot add DP OFF without a prior DP Setup for location ${record.location}`
        });
      }
      
      // Проверяем, что это будет последняя операция на локации
      const laterOps = sameLocation.filter(op => {
        const opDateTime = new Date(`${op.date}T${op.time}`);
        const currentDateTime = new Date(`${record.date}T${record.time}`);
        
        return opDateTime > currentDateTime;
      });
      
      if (laterOps.length > 0) {
        allErrors.push({
          field: 'operationType',
          message: `DP OFF must be the last operation for location ${record.location}`
        });
      }
    }
    // Для других операций проверяем, что они идут в правильной последовательности
    else {
      // Получаем последний DP Setup и последний тип операции перед текущей
      const operationsBefore = sameLocation.filter(op => {
        const opDateTime = new Date(`${op.date}T${op.time}`);
        const currentDateTime = new Date(`${record.date}T${record.time}`);
        
        return opDateTime < currentDateTime;
      });
      
      if (operationsBefore.length > 0) {
        // Сортируем по дате и времени
        const sortedOpsBefore = [...operationsBefore].sort((a, b) => {
          if (a.date !== b.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          return b.time.localeCompare(a.time);
        });
        
        // Последняя операция до текущей
        const lastOp = sortedOpsBefore[0];
        
        // Проверяем последовательность
        const lastIndex = operationSequence.indexOf(lastOp.operationType);
        const currentIndex = operationSequence.indexOf(record.operationType);
        
        if (lastIndex >= currentIndex) {
          allErrors.push({
            field: 'operationType',
            message: `Invalid operation sequence: ${lastOp.operationType} cannot be followed by ${record.operationType}`
          });
        }
      } else {
        // Нет операций до текущей, но операция не DP Setup
        allErrors.push({
          field: 'operationType',
          message: `First operation for location ${record.location} must be DP Setup, but found ${record.operationType}`
        });
      }
    }
    
    // Проверка на перекрытие времени с другими локациями
    allErrors = [...allErrors, ...validateTimeOverlap(record, excludeId)];
    
    return allErrors;
  }, [data, checkDuplicate, validateTimeOverlap, validateDpOffOnPreviousLocation]);

  // Валидация для группы операций на одной локации
  const validateLocationOperations = useCallback((date: string, location: string, operations: Omit<DPHours, 'id'>[]): ValidationError[] => {
    let allErrors: ValidationError[] = [];
    
    // Если нет операций для проверки
    if (operations.length === 0) return [];
    
    // Получаем существующие операции для этой локации
    const existingOps = data.filter(op => op.location === location);
    
    // Создаем временные ID для новых операций
    const nowTimestamp = Date.now();
    const tempOps = operations.map((op, index) => ({ 
      ...op, 
      id: `temp-${nowTimestamp}-${index}`,
      location,
      date: op.date || date // Используем указанную дату или дату из параметра
    } as DPHours));
    
    // Создаем полный список операций для проверки
    const allOps = [...existingOps, ...tempOps];
    
    // Проверяем, содержит ли список новых операций DP Setup и является ли это
    // первой операцией для локации
    const hasNewSetup = tempOps.some(op => op.operationType === 'DP Setup');
    
    if (hasNewSetup && existingOps.length > 0) {
      // Проверяем, что новый DP Setup будет раньше всех существующих операций
      const newSetupOp = tempOps.find(op => op.operationType === 'DP Setup')!;
      const newSetupDateTime = new Date(`${newSetupOp.date}T${newSetupOp.time}`);
      
      const earliestExistingOp = existingOps.reduce((earliest, op) => {
        const opDateTime = new Date(`${op.date}T${op.time}`);
        return opDateTime < new Date(`${earliest.date}T${earliest.time}`) ? op : earliest;
      }, existingOps[0]);
      
      const earliestExistingDateTime = new Date(`${earliestExistingOp.date}T${earliestExistingOp.time}`);
      
      if (earliestExistingDateTime < newSetupDateTime) {
        allErrors.push({
          field: 'operationType',
          message: `DP Setup must be the first operation for location, but there is an earlier operation on ${earliestExistingOp.date} at ${earliestExistingOp.time}`
        });
      }
    }
    
    // Если это новая локация (нет существующих операций) и нет DP Setup в новых операциях,
    // то должна быть ошибка
    if (existingOps.length === 0 && !hasNewSetup) {
      allErrors.push({
        field: 'operationType',
        message: `First operation for a new location must be DP Setup`
      });
    }
    
    // Проверяем последовательность операций
    const sequenceErrors = validateOperationSequence(location, allOps);
    allErrors = [...allErrors, ...sequenceErrors];
    
    // Группируем операции по дате, чтобы проверять конфликты только в пределах одного дня
    const opsByDate: Record<string, Omit<DPHours, 'id'>[]> = {};
    tempOps.forEach(op => {
      if (!opsByDate[op.date]) {
        opsByDate[op.date] = [];
      }
      opsByDate[op.date].push(op);
    });
    
    // Проверяем каждую новую операцию на дубликаты и перекрытия с другими локациями в рамках её даты
    for (const dateStr in opsByDate) {
      const dateOps = opsByDate[dateStr];
      
      // Проверка на дубликаты в рамках даты
      const uniqueTimes = new Set<string>();
      for (const op of dateOps) {
        if (uniqueTimes.has(op.time)) {
          allErrors.push({
            field: 'time',
            message: `Duplicate: An operation at ${op.time} already exists for location ${location} on ${op.date}`
          });
        } else {
          uniqueTimes.add(op.time);
        }
      }
      
      // Проверка на дубликаты с существующими операциями
      const existingOpsForDate = existingOps.filter(op => op.date === dateStr);
      for (const op of dateOps) {
        const isDuplicate = existingOpsForDate.some(existingOp => 
          existingOp.time === op.time
        );
        
        if (isDuplicate) {
          allErrors.push({
            field: 'time',
            message: `Duplicate: An operation at ${op.time} already exists for location ${location} on ${op.date}`
          });
        }
        
        // Проверка на перекрытие времени с другими локациями - только для текущей даты
        if (op.operationType !== 'DP Setup') {
          const overlapErrors = validateTimeOverlap(op, undefined); // Для новых операций мы не передаем ID
          allErrors = [...allErrors, ...overlapErrors];
        }
      }
    }
    
    // Проверка на наличие DP OFF на предыдущих локациях для операций DP Setup
    const setupOps = tempOps.filter(op => op.operationType === 'DP Setup');
    for (const op of setupOps) {
      const dpOffErrors = validateDpOffOnPreviousLocation(op);
      allErrors = [...allErrors, ...dpOffErrors];
    }
    
    return allErrors;
  }, [data, validateOperationSequence, validateTimeOverlap, validateDpOffOnPreviousLocation]);

  // Сброс ошибок
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    setErrors,
    clearErrors,
    checkDuplicate,
    validateRecord,
    validateLocationOperations,
    validateOperationSequence,
    validateTimeOverlap,
    validateDpOffOnPreviousLocation
  };
};

export default useValidation; 