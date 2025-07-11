import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { 
  Brightness4 as DarkModeIcon, 
  Brightness7 as LightModeIcon 
} from '@mui/icons-material';
import { useTheme } from '../../providers/ThemeProvider';

const GlobalThemeToggle: React.FC = () => {
  const { isNightMode, toggleTheme } = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1300, // Above most components but below modals
      }}
    >
      <Tooltip title={isNightMode ? "Switch to Light Mode" : "Switch to Night Mode"}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            width: 48,
            height: 48,
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
            color: 'text.primary',
          }}
        >
          {isNightMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default GlobalThemeToggle; 