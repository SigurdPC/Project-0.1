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
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import { formatDate as formatDateDisplay, parseUserDateInput } from '../utils/dateUtils';

export interface Column {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: string[];
  searchable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onAdd: (newData: any) => void;
  onEdit: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;
}

const DataTable = ({ columns, data, onAdd, onEdit, onDelete }: DataTableProps) => {
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
        sx={{ 
          mb: 2,
          // Добавляем стили для полей ввода даты, чтобы изменить формат отображения
          ...(column.type === 'date' && {
            '& input::-webkit-datetime-edit': {
              fontFamily: 'inherit',
            },
            '& input': {
              '&:before': {
                content: 'attr(placeholder)'
              }
            }
          })
        }}
        inputProps={{
          max: column.type === 'date' ? '9999-12-31' : undefined,
          placeholder: column.type === 'date' ? 'дд.мм.гггг' : undefined
        }}
        placeholder={column.type === 'date' ? 'дд.мм.гггг' : undefined}
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
          placeholder="Поиск..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ width: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
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
                  {searchQuery ? 'Нет результатов по вашему запросу' : 'Нет данных'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="на странице:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
        />
      </TableContainer>

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

export default DataTable; 