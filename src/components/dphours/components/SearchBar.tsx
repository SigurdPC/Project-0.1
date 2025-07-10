import React from 'react';
import { TextField, InputAdornment, Box, useTheme } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Константа для высоты полей поиска
const SEARCH_HEIGHT = 40;

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  width?: string | number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
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
        autoComplete="off"
        sx={{ 
          width,
          '& .MuiOutlinedInput-root': {
            height: SEARCH_HEIGHT,
            borderRadius: '8px',
          },
          '& .MuiInputBase-input': {
            height: '100%',
            boxSizing: 'border-box',
            padding: '8px 14px',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar; 