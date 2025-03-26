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
  return (
    <Paper 
      sx={{ 
        mb: 1,
        overflow: 'hidden',
        boxShadow: isExpanded ? 3 : 1
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: isExpanded ? 'primary.light' : 'inherit',
          color: isExpanded ? 'white' : 'inherit',
          transition: 'background-color 0.3s'
        }}
        onClick={onToggleExpand}
      >
        <Typography variant="h6">{formatDate(date)}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={`${eventsCount} events in ${locationsCount} locations`}
            size="small" 
            sx={{ mr: 1 }}
          />
          {isExpanded ? 
            <KeyboardArrowUpIcon /> : 
            <KeyboardArrowDownIcon />
          }
        </Box>
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default HistoryItem; 