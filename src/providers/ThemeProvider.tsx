import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
  isNightMode: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  isNightMode: false,
});

export const useTheme = () => useContext(ThemeContext);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
  });
  
  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };
  
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    
    if (!savedMode) {
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 20 || currentHour < 7;
      
      if (isNightTime) {
        setMode('dark');
        localStorage.setItem('themeMode', 'dark');
      }
    }
  }, []);
  
  const isNightMode = mode === 'dark';

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
            light: mode === 'dark' ? '#374151' : '#42a5f5',
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)',
            secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
          action: {
            active: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
            hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                transition: 'background-color 0.3s ease',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                ...(mode === 'dark' && {
                  backgroundColor: '#1e1e1e',
                }),
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
              },
              containedPrimary: {
                backgroundColor: mode === 'dark' ? '#1565c0' : '#1976d2',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? '#1976d2' : '#1565c0',
                },
              },
            },
            variants: [
              {
                props: { variant: 'contained' },
                style: {
                  ...(mode === 'dark' && {
                    backgroundColor: '#2c3e50',
                    color: 'rgba(255, 255, 255, 0.85)',
                    '&:hover': {
                      backgroundColor: '#34495e',
                    },
                  }),
                },
              },
            ],
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  '& .MuiInputBase-input': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#90caf9',
                    },
                  },
                }),
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              input: {
                ...(mode === 'dark' && {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }),
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(224, 224, 224, 1)',
              },
              head: {
                backgroundColor: mode === 'dark' ? '#263238' : '#f5f5f5',
                color: mode === 'dark' ? '#fff' : 'inherit',
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                ...(mode === 'dark' && {
                  backgroundColor: '#1e1e1e',
                  backgroundImage: 'none',
                }),
                boxShadow: mode === 'dark' 
                  ? '0px 11px 15px -7px rgba(0,0,0,0.4), 0px 24px 38px 3px rgba(0,0,0,0.3), 0px 9px 46px 8px rgba(0,0,0,0.2)'
                  : '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              },
              paperWidthMd: {
                maxWidth: '700px'
              },
              paperWidthSm: {
                maxWidth: '600px'
              }
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
                fontSize: '1.25rem',
                ...(mode === 'dark' && {
                  backgroundColor: '#252525',
                  color: 'rgba(255, 255, 255, 0.9)',
                }),
              },
            },
          },
          MuiDialogContent: {
            styleOverrides: {
              root: {
                padding: '20px 24px',
                ...(mode === 'dark' && {
                  backgroundColor: '#1e1e1e',
                  color: 'rgba(255, 255, 255, 0.8)',
                }),
                '&.MuiDialogContent-dividers': {
                  ...(mode === 'dark' && {
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }),
                },
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
                ...(mode === 'dark' && {
                  backgroundColor: '#252525',
                }),
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              },
            },
          },
          MuiFormControl: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  },
                }),
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              icon: {
                ...(mode === 'dark' && {
                  color: 'rgba(255, 255, 255, 0.5)',
                }),
              },
              select: {
                ...(mode === 'dark' && {
                  '&:focus': {
                    backgroundColor: 'transparent',
                  },
                }),
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(66, 165, 245, 0.15)',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(66, 165, 245, 0.25)',
                  },
                }),
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                transition: 'background-color 0.3s ease',
                '&.Mui-selected': {
                  backgroundColor: mode === 'dark' ? 'rgba(66, 165, 245, 0.15)' : 'rgba(25, 118, 210, 0.08)',
                },
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: 'background-color 0.3s ease',
                ...(mode === 'dark' && {
                  backgroundColor: '#121212',
                  color: 'rgba(255, 255, 255, 0.9)',
                }),
                '*::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '*::-webkit-scrollbar-track': {
                  backgroundColor: mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                },
                '*::-webkit-scrollbar-thumb': {
                  backgroundColor: mode === 'dark' ? '#555' : '#ccc',
                  borderRadius: '4px',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: mode === 'dark' ? '#777' : '#aaa',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
      isNightMode,
    }),
    [mode, isNightMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 