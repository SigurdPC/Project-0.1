import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Alert, CircularProgress, Snackbar,
  useTheme, alpha
} from '@mui/material';
import { 
  SailingOutlined, 
  WavesOutlined, 
  AnchorOutlined, 
  WaterOutlined
} from '@mui/icons-material';
import DPTimeSettings from '../components/dphours/views/DPTimeSettings';
import DPTimeResults from '../components/dphours/views/DPTimeResults';
import { DPTimeOperation, Shift, TimeCalculationResult } from '../components/dphours/types';
import { calculateOperationTimesByShifts, getDPTimeOperations } from '../components/dphours/utils';
import { useDataManagement } from '../components/dphours/hooks/useDataManagement';

interface DateRange {
  startDate: string;
  endDate: string;
  shifts: Shift[];
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const DPTimePage = () => {
  const theme = useTheme();
  const { data, loading, error } = useDataManagement();
  const [results, setResults] = useState<TimeCalculationResult[]>([]);
  const [operations, setOperations] = useState<DPTimeOperation[]>([]);
  const [resultsCalculated, setResultsCalculated] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Состояние настроек расчета
  const [settings, setSettings] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    shifts: [
      {
        id: Date.now().toString(),
        startTime: '08:00',
        endTime: '20:00',
        isOvernight: false
      }
    ]
  });

  // Преобразуем данные в операции при их изменении
  useEffect(() => {
    if (data) {
      const dpOperations = getDPTimeOperations(data);
      setOperations(dpOperations);
    }
  }, [data]);

  // Обработчики изменения настроек
  const handleStartDateChange = (date: string) => {
    setSettings((prev: DateRange) => ({ ...prev, startDate: date }));
  };
  
  const handleEndDateChange = (date: string) => {
    setSettings((prev: DateRange) => ({ ...prev, endDate: date }));
  };
  
  const handleAddShift = () => {
    const startTime = '08:00';
    const endTime = '20:00';
    const isOvernight = startTime > endTime;
    
    const newShift: Shift = {
      id: Date.now().toString(),
      startTime,
      endTime,
      isOvernight
    };
    
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };
  
  const handleUpdateShift = (id: string, field: keyof Shift, value: any) => {
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.map((shift: Shift) => 
        shift.id === id ? { ...shift, [field]: value } : shift
      )
    }));
  };
  
  const handleDeleteShift = (id: string) => {
    setSettings((prev: DateRange) => ({
      ...prev,
      shifts: prev.shifts.filter((shift: Shift) => shift.id !== id)
    }));
  };
  
  const handleCalculate = () => {
    if (!data) {
      setSnackbar({
        open: true,
        message: 'Нет данных для расчета',
        severity: 'warning'
      });
      return;
    }
    
    const results = calculateOperationTimesByShifts(
      operations,
      settings.startDate,
      settings.endDate,
      settings.shifts
    );
    
    setResults(results);
    setResultsCalculated(true);
    
    if (results.length > 0) {
      setSnackbar({
        open: true,
        message: 'Расчет успешно выполнен',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Нет результатов для отображения',
        severity: 'warning'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Maritime theme styles
  const maritimeStyles = {
    container: {
      backgroundImage: 'linear-gradient(to bottom, #e6f7ff, #ffffff)',
      borderRadius: theme.shape.borderRadius,
      pt: 3
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      mb: 2,
      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      pb: 2
    },
    iconContainer: {
      mr: 2,
      color: theme.palette.primary.main,
      animation: 'bob 3s ease-in-out infinite',
      '@keyframes bob': {
        '0%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-5px)' },
        '100%': { transform: 'translateY(0)' }
      }
    },
    wavesDecoration: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '15px',
      opacity: 0.2,
      zIndex: 0,
      backgroundColor: theme.palette.primary.main,
      backgroundImage: 'linear-gradient(45deg, transparent 50%, rgba(255,255,255,.5) 50%)',
      backgroundSize: '10px 10px'
    },
    paper: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px',
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    },
    emptyResultsMessage: {
      py: 6,
      px: 3,
      textAlign: 'center',
      color: alpha(theme.palette.text.secondary, 0.8),
      fontStyle: 'italic'
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={maritimeStyles.container}>
        <Box sx={maritimeStyles.header}>
          <Box sx={maritimeStyles.iconContainer}>
            <SailingOutlined fontSize="large" />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500, color: theme.palette.primary.main, mb: 0 }}>
            DP Time Calculation
          </Typography>
        </Box>
        
        {/* Блок настроек */}
        <Paper sx={{ 
          ...maritimeStyles.paper, 
          p: 3, 
          mb: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1976d2, #64b5f6, #1976d2)'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AnchorOutlined color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ mb: 0, fontWeight: 500 }}>
              Calculation Settings
            </Typography>
          </Box>
          
          <DPTimeSettings 
            settings={settings}
            loading={loading}
            error={error}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            onCalculate={handleCalculate}
          />
          <Box sx={maritimeStyles.wavesDecoration} />
        </Paper>
        
        {/* Блок результатов - отображается только если были рассчитаны результаты */}
        {resultsCalculated && (
          <Paper sx={{ 
            ...maritimeStyles.paper, 
            mb: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #1976d2, #64b5f6, #1976d2)'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 1 }}>
              <WavesOutlined color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                DP Hours Summary
              </Typography>
            </Box>
            
            <DPTimeResults 
              results={results}
              operations={operations}
              onBack={() => {}} // Пустая функция, так как мы не используем навигацию назад
            />
            <Box sx={maritimeStyles.wavesDecoration} />
          </Paper>
        )}

        {/* Snackbar для уведомлений */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            icon={<WaterOutlined />}
            sx={{ 
              '& .MuiAlert-icon': { 
                color: theme.palette.primary.main 
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}; 