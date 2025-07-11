import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Engineering as EngineeringIcon,
  Navigation as BridgeIcon,
  LocalGasStation as BunkeringIcon,
  Event as DailyEventsIcon,
  Storage as DailyROBIcon,
  AccessTime as DPHoursIcon,
  DirectionsBoat as ShipIcon,
  MenuBook as MenuBookIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const engineItems = [
    {
      title: 'Bunkering',
      description: 'Fuel operations and bunkering records',
      icon: <BunkeringIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/bunkering',
      color: '#ff9800'
    },
    {
      title: 'Daily Events',
      description: 'Daily operational events and activities',
      icon: <DailyEventsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/daily-events',
      color: '#4caf50'
    },
    {
      title: 'Daily ROB',
      description: 'Remaining On Board fuel records',
      icon: <DailyROBIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/daily-rob',
      color: '#2196f3'
    },
    {
      title: 'Engine Log',
      description: 'Engine room operations and maintenance log',
      icon: <SettingsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/engine-log',
      color: '#9c27b0'
    }
  ];

  const bridgeItems = [
    {
      title: 'DP Hours',
      description: 'Dynamic positioning operations and time tracking',
      icon: <DPHoursIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/dphours',
      color: '#673ab7'
    },
    {
      title: 'Deck Log',
      description: 'Navigation deck log and watch records',
      icon: <MenuBookIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/deck-log',
      color: '#2196f3'
    },
    {
      title: 'Crew Management',
      description: 'Crew records and personnel management',
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/crew-management',
      color: '#4caf50'
    },
    {
      title: 'Vessel Certificates',
      description: 'Ship certificates and documentation',
      icon: <DescriptionIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      route: '/vessel-certificates',
      color: '#ff9800'
    }
  ];

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <ShipIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Operation Log
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Maritime Operations Management System
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Engine Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
                          background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EngineeringIcon sx={{ fontSize: 32, mr: 2 }} />
              <Typography variant="h4" component="h2" fontWeight="bold">
                Engine
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Fuel management and operational records
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            {engineItems.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleNavigation(item.route)}
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h3" fontWeight="600">
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Bridge Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
                          background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #0f4c75 0%, #3282b8 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BridgeIcon sx={{ fontSize: 32, mr: 2 }} />
              <Typography variant="h4" component="h2" fontWeight="bold">
                Bridge
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Navigation and positioning operations
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            {bridgeItems.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleNavigation(item.route)}
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h3" fontWeight="600">
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Maritime Operations Management System - Choose your department to begin
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage; 