import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Ship Management System
        </Typography>
        <Box>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/bunkering"
            sx={{
              backgroundColor: isActive('/bunkering') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: isActive('/bunkering') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Bunkering Operation
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/daily-events"
            sx={{
              backgroundColor: isActive('/daily-events') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: isActive('/daily-events') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Daily Events
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/daily-rob"
            sx={{
              backgroundColor: isActive('/daily-rob') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: isActive('/daily-rob') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Daily ROB
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/dp-hours"
            sx={{
              backgroundColor: isActive('/dp-hours') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: isActive('/dp-hours') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            DP Hours
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 