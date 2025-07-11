import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  Brightness4 as DarkModeIcon, 
  Brightness7 as LightModeIcon 
} from '@mui/icons-material';
import { useTheme } from '../providers/ThemeProvider';

const Navigation = () => {
  const location = useLocation();
  const { isNightMode, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography 
            variant="h5" 
            component={RouterLink} 
            to="/"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 500,
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            Operation Log
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              component={RouterLink} 
              to="/"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/') ? 'bold' : 'normal',
                borderBottom: isActive('/') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              Home
            </Button>
            <Button 
              component={RouterLink} 
              to="/bunkering"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/bunkering') ? 'bold' : 'normal',
                borderBottom: isActive('/bunkering') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              Bunkering
            </Button>
            <Button 
              component={RouterLink} 
              to="/daily-events"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/daily-events') ? 'bold' : 'normal',
                borderBottom: isActive('/daily-events') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              Daily Events
            </Button>
            <Button 
              component={RouterLink} 
              to="/daily-rob"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/daily-rob') ? 'bold' : 'normal',
                borderBottom: isActive('/daily-rob') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              Daily ROB
            </Button>
            <Button 
              component={RouterLink} 
              to="/dphours"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/dphours') ? 'bold' : 'normal',
                borderBottom: isActive('/dphours') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              DP Hours
            </Button>
            <Button 
              component={RouterLink} 
              to="/vessel-certificates"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/vessel-certificates') ? 'bold' : 'normal',
                borderBottom: isActive('/vessel-certificates') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              Vessel Certificates
            </Button>
            <Tooltip title={isNightMode ? "Switch to Light Mode" : "Switch to Night Mode"}>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={{ 
                  ml: 2,
                  border: '1px solid rgba(255,255,255,0.3)', 
                  borderRadius: '8px',
                  p: 1
                }}
              >
                {isNightMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 