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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState } from 'react';

export interface Column {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: string[];
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
    
    if (column?.type === 'date' && value) {
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
        sx={{ mb: 2 }}
        inputProps={{
          max: column.type === 'date' ? '9999-12-31' : undefined
        }}
      />
    );
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add New
      </Button>
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
            {data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{row[column.id]}</TableCell>
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
          </TableBody>
        </Table>
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