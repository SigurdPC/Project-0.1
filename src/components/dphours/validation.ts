import { DPHours, OperationType } from './types';

// Определение порядка операций для проверки последовательности
const OPERATION_ORDER: Record<OperationType, number> = {
  'DP Setup': 1,
  'Moving in': 2,
  'Handling Offshore': 3,
  'Pulling Out': 4,
  'DP OFF': 5
};

// Интерфейс результата валидации
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Проверяет наличие дубликатов операций в пределах одной локации
 */
export const validateNoDuplicateOperations = (
  operations: DPHours[],
  date: string,
  location: string
): ValidationResult => {
  const operationTypes = operations
    .filter(op => op.date === date && op.location === location)
    .map(op => op.operationType);

  // Проверяем наличие дубликатов операций
  const uniqueOperations = new Set(operationTypes);
  if (uniqueOperations.size !== operationTypes.length) {
    return {
      isValid: false,
      error: 'Duplicate operation types are not allowed within the same location. Each operation type can be used only once.'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Проверяет правильную последовательность операций для заданной локации
 */
export const validateOperationSequence = (
  operations: DPHours[],
  date: string,
  location: string
): ValidationResult => {
  // Получаем все операции для данной локации, сортируем по времени
  const locationOperations = operations
    .filter(op => op.date === date && op.location === location)
    .sort((a, b) => a.time.localeCompare(b.time));
  
  if (locationOperations.length === 0) {
    return { isValid: true, error: null };
  }

  // Проверка на наличие обязательных DP Setup (первая) и DP OFF (последняя)
  const hasSetup = locationOperations.some(op => op.operationType === 'DP Setup');
  const hasOff = locationOperations.some(op => op.operationType === 'DP OFF');

  if (!hasSetup) {
    return {
      isValid: false,
      error: 'DP Setup is required and must be the first operation in the sequence'
    };
  }

  if (!hasOff) {
    return {
      isValid: false,
      error: 'DP OFF is required and must be the last operation in the sequence'
    };
  }

  // Проверка на правильную последовательность
  let prevOpRank = 0;
  for (const op of locationOperations) {
    const currentRank = OPERATION_ORDER[op.operationType];
    
    if (currentRank < prevOpRank) {
      return {
        isValid: false,
        error: `Invalid operation sequence. Operations must follow this order: DP Setup, Moving in, Handling Offshore, Pulling Out, DP OFF`
      };
    }
    
    prevOpRank = currentRank;
  }

  // Проверка, что первая операция - DP Setup, а последняя - DP OFF
  if (locationOperations[0].operationType !== 'DP Setup') {
    return {
      isValid: false,
      error: 'The first operation must be DP Setup'
    };
  }

  if (locationOperations[locationOperations.length - 1].operationType !== 'DP OFF') {
    return {
      isValid: false,
      error: 'The last operation must be DP OFF'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Проверяет временную последовательность операций
 */
export const validateTimeSequence = (
  operations: DPHours[],
  date: string,
  location: string
): ValidationResult => {
  // Получаем все операции для данной локации, сортируем по времени
  const locationOperations = operations
    .filter(op => op.date === date && op.location === location)
    .sort((a, b) => a.time.localeCompare(b.time));
  
  if (locationOperations.length <= 1) {
    return { isValid: true, error: null };
  }

  // Проверяем, что время идет в возрастающем порядке
  let prevTime = '';
  for (const op of locationOperations) {
    if (prevTime && op.time <= prevTime) {
      return {
        isValid: false,
        error: `Time must be in ascending order. Operation ${op.operationType} cannot occur at ${op.time} which is before or equal to the previous operation at ${prevTime}`
      };
    }
    prevTime = op.time;
  }

  return { isValid: true, error: null };
};

/**
 * Проверяет, что операции не накладываются друг на друга по времени между разными локациями
 */
export const validateNoTimeOverlap = (
  allOperations: DPHours[],
  operations: DPHours[],
  date: string,
  location: string,
  excludeIds: string[] = []
): ValidationResult => {
  const locationOperations = operations
    .filter(op => op.date === date && op.location === location);

  if (locationOperations.length === 0) {
    return { isValid: true, error: null };
  }

  // Операции из других локаций на ту же дату
  const otherLocationOperations = allOperations.filter(op => 
    op.date === date && 
    op.location !== location && 
    !excludeIds.includes(op.id)
  );

  for (const op of locationOperations) {
    // Ищем пересечения по времени с операциями из других локаций
    const conflictingOp = otherLocationOperations.find(otherOp => 
      otherOp.time === op.time
    );

    if (conflictingOp) {
      return {
        isValid: false,
        error: `Time conflict: Operation at ${op.time} overlaps with another operation at location "${conflictingOp.location}". Operations cannot occur simultaneously in different locations.`
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Проверяет, что новый DP Setup на новой локации начинается только после DP OFF на предыдущей
 */
export const validateNewSetupAfterPreviousOff = (
  allOperations: DPHours[],
  operations: DPHours[],
  date: string,
  location: string
): ValidationResult => {
  // Находим операцию DP Setup в новой серии
  const setupOp = operations.find(op => 
    op.date === date && 
    op.location === location && 
    op.operationType === 'DP Setup'
  );

  if (!setupOp) {
    return { isValid: true, error: null }; // Нет DP Setup, пропускаем проверку
  }

  // Находим все операции DP OFF на эту дату
  const offOps = allOperations
    .filter(op => 
      op.date === date && 
      op.location !== location && 
      op.operationType === 'DP OFF'
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  // Если нет завершенных DP OFF или время нового DP Setup раньше времени всех DP OFF
  if (offOps.length === 0) {
    // Проверяем, есть ли вообще другие операции на этот день
    const otherOps = allOperations.filter(op => 
      op.date === date && 
      op.location !== location
    );

    if (otherOps.length > 0) {
      return {
        isValid: false,
        error: `Cannot start new operations at location "${location}" because there are incomplete operations at other locations. Each location's operations must end with DP OFF before starting a new series.`
      };
    }
  } else {
    // Находим ближайший предшествующий DP OFF
    let hasPreviousOff = false;
    for (const offOp of offOps) {
      if (offOp.time < setupOp.time) {
        hasPreviousOff = true;
        break;
      }
    }

    // Проверяем незавершенные локации (без DP OFF)
    const locationsWithSetup = new Set(
      allOperations
        .filter(op => 
          op.date === date && 
          op.location !== location && 
          op.operationType === 'DP Setup'
        )
        .map(op => op.location)
    );
    
    const locationsWithOff = new Set(
      allOperations
        .filter(op => 
          op.date === date && 
          op.location !== location && 
          op.operationType === 'DP OFF'
        )
        .map(op => op.location)
    );

    // Локации, у которых есть DP Setup, но нет DP OFF
    const incompleteLocations = [...locationsWithSetup].filter(loc => 
      !locationsWithOff.has(loc)
    );

    if (incompleteLocations.length > 0 && !hasPreviousOff) {
      return {
        isValid: false,
        error: `Cannot start new operations at location "${location}" because there are incomplete operations at location "${incompleteLocations[0]}". Previous operations must end with DP OFF before starting a new series.`
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Проверяет, что все операции в локации образуют законченную серию (от DP Setup до DP OFF)
 */
export const validateCompleteOperationSeries = (
  operations: DPHours[],
  date: string,
  location: string
): ValidationResult => {
  const locationOperations = operations
    .filter(op => op.date === date && op.location === location);

  if (locationOperations.length < 2) {
    return {
      isValid: false,
      error: 'Each location must have at least two operations: DP Setup and DP OFF'
    };
  }

  // Проверяем наличие DP Setup и DP OFF
  const hasSetup = locationOperations.some(op => op.operationType === 'DP Setup');
  const hasOff = locationOperations.some(op => op.operationType === 'DP OFF');

  if (!hasSetup || !hasOff) {
    return {
      isValid: false,
      error: 'Each location must have both DP Setup and DP OFF operations'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Комплексная валидация для операций DP Hours
 */
export const validateDPHoursOperations = (
  allOperations: DPHours[],
  operations: DPHours[],
  date: string,
  location: string,
  excludeIds: string[] = []
): ValidationResult => {
  // Проверка наличия дубликатов операций
  const duplicateCheck = validateNoDuplicateOperations(operations, date, location);
  if (!duplicateCheck.isValid) {
    return duplicateCheck;
  }

  // Проверка последовательности операций
  const sequenceCheck = validateOperationSequence(operations, date, location);
  if (!sequenceCheck.isValid) {
    return sequenceCheck;
  }

  // Проверка временной последовательности
  const timeSequenceCheck = validateTimeSequence(operations, date, location);
  if (!timeSequenceCheck.isValid) {
    return timeSequenceCheck;
  }

  // Проверка пересечений по времени с другими локациями
  const overlapCheck = validateNoTimeOverlap(allOperations, operations, date, location, excludeIds);
  if (!overlapCheck.isValid) {
    return overlapCheck;
  }

  // Проверка новой серии только после завершения предыдущей
  const newSetupCheck = validateNewSetupAfterPreviousOff(allOperations, operations, date, location);
  if (!newSetupCheck.isValid) {
    return newSetupCheck;
  }

  // Проверка на полноту серии операций
  const completeSeriesCheck = validateCompleteOperationSeries(operations, date, location);
  if (!completeSeriesCheck.isValid) {
    return completeSeriesCheck;
  }

  return { isValid: true, error: null };
}; 