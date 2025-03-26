import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Ship Operations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
                fontWeight: isActive('/dphours') || isActive('/') ? 'bold' : 'normal',
                borderBottom: (isActive('/dphours') || isActive('/')) ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              DP Hours
            </Button>
            <Button 
              component={RouterLink} 
              to="/dptime"
              color="inherit"
              sx={{ 
                fontWeight: isActive('/dptime') ? 'bold' : 'normal',
                borderBottom: isActive('/dptime') ? '2px solid white' : 'none',
                borderRadius: 0,
                pb: 0.5
              }}
            >
              DP Time
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 