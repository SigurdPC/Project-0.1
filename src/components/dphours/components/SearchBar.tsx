import React from 'react';
import { TextField, InputAdornment, Box, useTheme, alpha } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  width?: string | number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Поиск...',
  width = '250px'
}) => {
  const theme = useTheme();
  
  return (
    <Box>
      <TextField
        placeholder={placeholder}
        value={searchQuery}
        onChange={onSearchChange}
        size="small"
        sx={{ 
          width,
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transform: 'translateY(-1px)'
            },
            '&.Mui-focused': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
              transform: 'translateY(-2px)'
            }
          },
          '& .MuiInputBase-input': {
            padding: '10px 14px',
            '&::placeholder': {
              opacity: 0.7,
              transition: 'opacity 0.2s ease',
            },
            '&:focus::placeholder': {
              opacity: 0.5
            }
          },
          '& .MuiInputAdornment-root': {
            marginLeft: '8px',
            '& .MuiSvgIcon-root': {
              fontSize: '1.2rem',
              color: theme.palette.primary.main,
              opacity: 0.7,
              transition: 'all 0.2s ease',
            }
          },
          '&:hover .MuiInputAdornment-root .MuiSvgIcon-root': {
            opacity: 1,
            transform: 'scale(1.1)'
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar; 