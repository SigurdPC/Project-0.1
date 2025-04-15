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
  InputAdornment,
  Typography,
  CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { formatDate as formatDateDisplay, parseUserDateInput } from '../utils/dateUtils';
import AppDatePicker from './common/AppDatePicker';

// Константа для высоты полей ввода
const INPUT_HEIGHT = 56;
const INPUT_STYLES = {
  height: INPUT_HEIGHT,
  padding: '14px',
  boxSizing: 'border-box' as const
};

export interface Column {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: string[];
  searchable?: boolean;
  min?: number;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onAdd: (newData: any) => Promise<boolean> | boolean;
  onEdit: (id: string, updatedData: any) => Promise<boolean> | boolean;
  onDelete: (id: string) => void;
}

const DataTable = ({ columns, data, onAdd, onEdit, onDelete }: DataTableProps) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  
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

  // Функция для получения текущей даты в формате YYYY-MM-DD
  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpen = (row?: any) => {
    if (row) {
      setEditingId(row.id);
      setFormData({ ...row });
    } else {
      setEditingId(null);
      
      // Находим колонку с типом date и id = 'date'
      const dateColumn = columns.find(col => col.type === 'date' && col.id === 'date');
      
      // Если такая колонка существует, устанавливаем текущую дату
      if (dateColumn) {
        setFormData({ date: getCurrentDate() });
      } else {
        setFormData({});
      }
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

  const handleSubmit = async () => {
    // Валидация формы перед отправкой
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setLoading(true);
    let success = false;
    
    try {
      if (editingId) {
        success = await onEdit(editingId, formData);
      } else {
        success = await onAdd({ ...formData, id: Date.now().toString() });
      }
      
      // Закрываем окно только если операция успешна
      if (success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Если произошла ошибка, не закрываем окно
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для валидации формы
  const validateForm = (): string | null => {
    for (const column of columns) {
      const value = formData[column.id];
      
      // Проверка обязательных полей
      if (column.id === 'date' && !value) {
        return `${column.label} is required`;
      }
      
      // Проверка минимальных значений для числовых полей
      if (column.type === 'number' && column.min !== undefined && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue < column.min) {
          return `${column.label} cannot be less than ${column.min}`;
        }
      }
    }
    
    return null;
  };
  
  // Обработчики пагинации
  const handleChangePage = (_: unknown, newPage: number) => {
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
              height: INPUT_HEIGHT,
              '& .MuiSelect-select': {
                height: INPUT_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                paddingTop: '0',
                paddingBottom: '0'
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
            inputProps={{ style: { height: INPUT_HEIGHT } }}
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
        inputProps={{
          min: column.type === 'number' && column.min !== undefined ? column.min : undefined,
          style: INPUT_STYLES
        }}
        sx={{ 
          mb: 2,
          '& .MuiInputBase-root': {
            height: INPUT_HEIGHT
          },
          '& input': {
            height: '100%',
            boxSizing: 'border-box'
          }
        }}
      />
    );
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          ADD NEW
        </Button>
        
        <TextField
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiInputBase-root': {
              height: 40
            }
          }}
        />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={`${row.id}-${column.id}`}>
                      {column.type === 'date' && row[column.id]
                        ? formatDateDisplay(row[column.id])
                        : row[column.id]}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(row)} size="small" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={() => onDelete(row.id)} 
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  {searchQuery ? 'No results found' : 'No data available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {filteredData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
      >
        <DialogTitle>
          {editingId ? 'Edit Record' : 'Add New Record'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            Please fill all required fields:
          </Typography>
          {columns.map((column) => renderFormField(column))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingId ? 'Save' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataTable; 