import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Chip, 
  Collapse,
  IconButton
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { DPHours } from '../types';
import { formatDate } from '../utils';
import { useTheme } from '../../../providers/ThemeProvider';

interface HistoryItemProps {
  date: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  eventsCount: number;
  locationsCount: number;
  children: React.ReactNode;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  date,
  isExpanded,
  onToggleExpand,
  eventsCount,
  locationsCount,
  children
}) => {
  const { isNightMode } = useTheme();
  
  return (
    <Paper 
      sx={{ 
        mb: 2,
        overflow: 'hidden',
        boxShadow: isExpanded ? '0 6px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        borderRadius: '10px',
        transition: 'box-shadow 0.3s'
      }}
    >
      <Box 
        sx={{ 
          p: 2.5, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: isExpanded 
            ? (isNightMode ? 'primary.light' : '#1976d2') 
            : 'inherit',
          color: isExpanded ? 'white' : 'inherit',
          transition: 'background-color 0.3s',
          '&:hover': {
            bgcolor: isExpanded 
              ? (isNightMode ? 'primary.light' : '#1565c0')
              : 'rgba(0,0,0,0.02)'
          }
        }}
        onClick={onToggleExpand}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>{formatDate(date)}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isExpanded ? 
            <KeyboardArrowUpIcon sx={{ fontSize: '1.5rem' }} /> : 
            <KeyboardArrowDownIcon sx={{ fontSize: '1.5rem' }} />
          }
        </Box>
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default HistoryItem; 