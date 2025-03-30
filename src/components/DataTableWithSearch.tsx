import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Box,
  Typography,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { formatDate as formatDateDisplay, parseUserDateInput } from '../utils/dateUtils';
import AppDatePicker from './common/AppDatePicker';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

export interface Column {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: string[];
  searchable?: boolean;
}

interface DataTableWithSearchProps {
  columns: Column[];
  data: any[];
  onAdd: (newData: any) => void;
  onEdit: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;
  title: string;
}

const DataTableWithSearch = ({ columns, data, onAdd, onEdit, onDelete, title }: DataTableWithSearchProps) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Пагинация
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  
  // Фильтрованные данные после применения поискового запроса
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(column => {
        // Пропускаем, если колонка не предназначена для поиска или значение не задано
        if (!column.searchable || !row[column.id]) return false;
        
        const value = String(row[column.id]).toLowerCase();
        
        // Для дат сначала форматируем в пользовательский формат
        if (column.type === 'date') {
          const formattedDate = formatDateDisplay(row[column.id]);
          return formattedDate.toLowerCase().includes(query);
        }
        
        // Для остальных типов просто ищем подстроку
        return value.includes(query);
      });
    });
  }, [data, searchQuery, columns]);
  
  // Текущая страница данных с учетом пагинации
  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);
  
  // Сброс страницы при изменении фильтра или данных
  useEffect(() => {
    setPage(0);
  }, [searchQuery, data]);

  const handleOpen = (row?: any) => {
    if (row) {
      setEditingId(row.id);
      setFormData(row);
    } else {
      setEditingId(null);
      setFormData({});
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (columnId: string, value: string) => {
    const column = columns.find(col => col.id === columnId);
    
    if (column?.type === 'date') {
      if (value) {
        // Если пользователь ввел дату в формате dd/mm/yyyy, преобразуем в yyyy-mm-dd
        value = parseUserDateInput(value);
        
        // Дополнительная проверка для формата yyyy-mm-dd
        const parts = value.split('-');
        if (parts[0]) {
          // Ограничиваем год до 4 цифр
          parts[0] = parts[0].slice(0, 4);
          // Если год больше 9999, устанавливаем 9999
          if (parseInt(parts[0]) > 9999) {
            parts[0] = '9999';
          }
          value = parts.join('-');
        }
      }
    }

    setFormData((prev: Record<string, any>) => ({ ...prev, [columnId]: value }));
  };

  const handleSubmit = () => {
    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd({ ...formData, id: Date.now().toString() });
    }
    handleClose();
  };
  
  // Обработчики пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Обработчик поиска
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const renderFormField = (column: Column) => {
    if (column.type === 'select' && column.options) {
      return (
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }} key={column.id}>
          <InputLabel shrink>{column.label}</InputLabel>
          <Select
            value={formData[column.id] || ''}
            label={column.label}
            onChange={(e) => handleChange(column.id, e.target.value)}
            notched
            sx={{
              '& .MuiSelect-select': {
                paddingTop: '16px',
                paddingBottom: '8px',
              }
            }}
          >
            {column.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (column.type === 'date') {
      return (
        <Box sx={{ mb: 2 }} key={column.id}>
          <AppDatePicker
            label={column.label}
            value={formData[column.id] || null}
            onChange={(date) => handleChange(column.id, date || '')}
            fullWidth
          />
        </Box>
      );
    }

    return (
      <TextField
        key={column.id}
        margin="dense"
        label={column.label}
        type={column.type || 'text'}
        fullWidth
        value={formData[column.id] || ''}
        onChange={(e) => handleChange(column.id, e.target.value)}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ mb: 2 }}
      />
    );
  };

  const theme = useTheme();

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {title}
        </Typography>
        
        <TextField
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ 
            width: '250px',
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
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          ADD NEW
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.type === 'date' ? formatDateDisplay(row[column.id]) : row[column.id]}
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => handleOpen(row)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(row.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 3 }}>
                  {searchQuery ? 'No results for your query' : 'No data'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingId ? 'Edit Record' : 'Add New Record'}
        </DialogTitle>
        <DialogContent>
          {columns.map((column) => renderFormField(column))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataTableWithSearch; 